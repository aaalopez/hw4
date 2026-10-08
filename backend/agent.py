"""
Agent entry/wiring for the Campus Customs shop assistant.

Loads:
  - the system prompt from prompts/prompt.md
  - the model, via Portkey's OpenAI-compatible endpoint, authenticated with
    PORTKEY_API_KEY from the project .env file
  - the tools the agent is allowed to call (tools.py)

and exposes run_chat(message, deps, message_history) for main.py's
/api/chat route to call.

Problem 8 (customer memory) adds two things on top of Problem 5-7:
  - ChatDeps: who's chatting (if logged in) and what page they're on,
    passed into every agent run via pydantic-ai's deps mechanism and
    turned into extra system-prompt context dynamically per request.
  - message_history support, so main.py can replay a logged-in shopper's
    prior turns and the agent actually remembers the conversation instead
    of answering each message in isolation.
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.usage import UsageLimits

import audit
import tools as shop_tools
from models import AgentReply, PageContext, Product, ProductCard, StockLookup

load_dotenv()

PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "prompt.md"

# Portkey's virtual key routes this to whatever model/deployment the course
# has configured, but the OpenAI-compatible API still expects a model name.
MODEL_NAME = os.environ.get("PORTKEY_MODEL", "gpt-4o-mini")
PORTKEY_BASE_URL = os.environ.get("PORTKEY_BASE_URL", "https://api.portkey.ai/v1")

# Problem 12 "loop limits" spec: a legitimate chat turn never needs more
# than a couple of tool calls (search, then a lookup or two) — these caps
# exist to stop a confused or adversarially-prompted run from looping
# forever burning API calls, not to constrain normal use. Hit either one
# and pydantic-ai raises UsageLimitExceeded, which run_chat below turns
# into a clean "try again" reply instead of a hang or a crash.
AGENT_USAGE_LIMITS = UsageLimits(request_limit=8, tool_calls_limit=6)


@dataclass
class ChatDeps:
    """
    Per-request context the agent needs but that isn't part of the chat
    message itself: who's chatting (None fields for a guest) and what page
    they're on. Built fresh in main.py for every /api/chat call and handed
    to agent.run(..., deps=...) — this is pydantic-ai's standard "deps"
    pattern, read by the dynamic system-prompt functions below via
    RunContext.
    """

    user_id: int | None
    first_name: str | None
    last_name: str | None
    email: str | None
    page_context: PageContext | None


def _load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_model() -> OpenAIChatModel:
    portkey_key = os.environ.get("PORTKEY_API_KEY")
    if not portkey_key:
        raise RuntimeError(
            "PORTKEY_API_KEY is not set. Add it to the project .env file."
        )

    # Portkey authenticates via the x-portkey-api-key header, not a bearer
    # token, so we build our own AsyncOpenAI client with that header rather
    # than letting pydantic-ai set a standard Authorization header.
    client = AsyncOpenAI(
        base_url=PORTKEY_BASE_URL,
        api_key="unused-portkey-uses-custom-header",
        default_headers={"x-portkey-api-key": portkey_key},
    )
    provider = OpenAIProvider(openai_client=client)
    return OpenAIChatModel(MODEL_NAME, provider=provider)


@lru_cache
def get_agent() -> Agent:
    agent = Agent(
        _build_model(),
        deps_type=ChatDeps,
        system_prompt=_load_system_prompt(),
        output_type=AgentReply,
    )

    @agent.system_prompt
    def customer_context(ctx: RunContext[ChatDeps]) -> str:
        """Who the agent is talking to — built fresh per request from the logged-in user, if any."""
        deps = ctx.deps
        if deps.user_id is None:
            return (
                "The shopper is browsing as a guest (not logged in). You can "
                "still help them fully, but their chat history won't be saved "
                "for next time — if it comes up naturally, you can mention that "
                "logging in or creating an account keeps their chat history."
            )
        return (
            f"You're chatting with a logged-in customer: {deps.first_name} "
            f"{deps.last_name} ({deps.email}). Their past conversation (if any) "
            "is included below as prior turns — use it for continuity, but "
            "always re-check the database tools for anything price/stock "
            "related rather than trusting what was said earlier."
        )

    @agent.system_prompt
    def page_context_prompt(ctx: RunContext[ChatDeps]) -> str:
        """
        What page the shopper is currently on. For a product detail page,
        resolves the product right here (real code, real DB lookup) and
        injects a short summary — so the agent can answer "do you have
        this in pink?" without an extra tool round-trip just to figure out
        what "this" refers to.
        """
        page_context = ctx.deps.page_context
        if page_context is None:
            return ""
        if page_context.page != "product_detail" or not page_context.product_id:
            return f'The shopper is currently on the "{page_context.page}" page of the site.'

        product = shop_tools.get_product(page_context.product_id)
        if product is None:
            return ""
        return (
            f'The shopper is currently viewing the product page for "{product.name}" '
            f"(id: {product.product_id}), a {product.garment_type} priced at "
            f"${product.price:.2f}, available in colors: {', '.join(product.colors)}. "
            'If they say "this", "it", or ask something without naming a '
            "product (like \"do you have this in pink?\" or \"what sizes does "
            'it come in?"), assume they mean this product unless they clearly '
            "name something else."
        )

    @agent.tool_plain
    def search_products(query: str) -> list[ProductCard]:
        """
        Search the Campus Customs catalogue by keyword (name, garment type,
        description, color, or tags). Use this first when you don't already
        know a product's exact id — e.g. the shopper describes an item or
        a whole category rather than naming one product precisely.

        When the shopper is browsing a category ("what hoodies do you
        have?", "show me navy stuff"), the results from this tool get
        rendered as real product cards on the website, not just listed in
        the chat bubble — so include every relevant product_id from these
        results in your structured output, not just one or two highlights.
        """
        return shop_tools.search_products(query)

    @agent.tool_plain
    def get_product(product_id: str) -> Product | None:
        """
        Get the real, current description, price, and per-size stock for
        one product by its id. Always call this (never answer from memory
        or guess) when a shopper asks about a product's price, description,
        colors, or what sizes/quantities are available.
        """
        return shop_tools.get_product(product_id)

    @agent.tool_plain
    def check_size_stock(product_id: str, size: str) -> StockLookup:
        """
        Check real-time stock for one specific product + size. Always call
        this (never guess) when a shopper asks whether a specific size is
        available. The result tells you two different things — whether
        that size is offered at all, and whether it's currently in stock —
        so you can give the shopper the right message in each case.
        """
        return shop_tools.check_size_stock(product_id, size)

    @agent.tool_plain
    def recommend_alternatives(product_id: str) -> list[ProductCard]:
        """
        Find other in-stock products to suggest when a product (or the
        size the shopper wanted) is sold out. Call this right after
        `get_product` or `check_size_stock` tells you something is out of
        stock, so you can offer a real, currently-available alternative
        instead of leaving the shopper with just a "no." Returns real
        catalogue matches (same garment type first, related tags as a
        fallback) — never guess at a substitute yourself.
        """
        return shop_tools.recommend_alternatives(product_id)

    return agent


def build_message_history(rows: list) -> list[ModelMessage]:
    """
    Convert stored chat_messages rows (role, content) into pydantic-ai's
    ModelMessage history format so a prior conversation can be replayed
    into agent.run(..., message_history=...). Verified this works even
    though the agent uses structured output (AgentReply) — pydantic-ai
    only needs plain text content to reconstruct prior turns, it doesn't
    need to replay the exact tool-call mechanics that produced them.
    """
    history: list[ModelMessage] = []
    for row in rows:
        if row["role"] == "user":
            history.append(ModelRequest(parts=[UserPromptPart(content=row["content"])]))
        elif row["role"] == "assistant":
            history.append(ModelResponse(parts=[TextPart(content=row["content"])]))
    return history


async def run_chat(
    message: str,
    deps: ChatDeps,
    message_history: list[ModelMessage] | None = None,
) -> AgentReply:
    agent = get_agent()
    try:
        result = await agent.run(
            message,
            deps=deps,
            message_history=message_history,
            usage_limits=AGENT_USAGE_LIMITS,
        )
    except UsageLimitExceeded as exc:
        audit.log_agent_error(
            exc, user_id=deps.user_id, message=message, stop_reason="usage_limit_exceeded"
        )
        raise
    except Exception as exc:
        audit.log_agent_error(
            exc, user_id=deps.user_id, message=message, stop_reason=f"error:{type(exc).__name__}"
        )
        raise

    audit.log_agent_run(result, user_id=deps.user_id, message=message)
    return result.output
