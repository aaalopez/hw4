"""
Pydantic / PydanticAI structured types shared across the API and the agent.

Keeping these in one place means the FastAPI routes, the agent's tools, and
the agent's structured output all agree on the same shapes.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator

# --- Catalogue / inventory --------------------------------------------------


class InventoryLine(BaseModel):
    size: str
    quantity: int


class ProductCard(BaseModel):
    """
    Lightweight product reference used in the Products grid and in chat
    search results (Problem 7). This is the API contract between the agent
    and the frontend: whatever fields are here are exactly what a product
    card can render — image, name, price, and `garment_type` as the "short
    info" line — whether the card came from GET /api/products or from a
    chat-driven search. Keeping one shared shape means the frontend has a
    single <ProductCard> rendering path regardless of where the data came
    from, and clicking any card (chat-added or not) behaves identically.
    """

    product_id: str
    name: str
    garment_type: str
    price: float
    image_url: str
    in_stock: bool


class Product(ProductCard):
    """Full product detail, as served by /api/products/{id} and used by the agent."""

    description: str
    colors: list[str]
    search_tags: list[str]
    inventory: list[InventoryLine]
    total_stock: int


class StockLookup(BaseModel):
    """
    Result of checking one product + size combination.

    Deliberately uses two explicit booleans rather than a bare
    int/None return, so the agent never has to infer meaning from a
    number alone:
      - `size_offered` answers "does this product even come in this size?"
      - `in_stock` (quantity > 0) answers "is it currently available?"
    Collapsing those into one value (e.g. returning None for "no such
    size" and 0 for "sold out") invites the model to mix up "we don't
    carry that size" with "that size is out of stock" — two answers a
    shopper needs worded differently.
    """

    product_id: str
    size: str
    size_offered: bool
    quantity: int = 0
    in_stock: bool = False


# --- Auth --------------------------------------------------------------------


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field can't be blank.")
        return value

    @field_validator("password")
    @classmethod
    def min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    """What the API returns about a user — never includes password_hash."""

    id: int
    first_name: str
    last_name: str
    email: str


# --- Chat ----------------------------------------------------------------------


class PageContext(BaseModel):
    """
    Where the shopper currently is on the site, sent with every chat
    message (Problem 8). Lets the agent resolve "this" / "it" in a
    question like "do you have this in pink?" without the shopper having
    to name the product again.
    """

    page: str  # "home" | "products" | "product_detail" | "about" | "login" | "create_account" | "other"
    product_id: str | None = None  # set when page == "product_detail"


class ChatRequest(BaseModel):
    # Capped so one request can't burn an unbounded amount of model tokens
    # (cost/abuse risk, not a content-safety one) — 2000 chars is generous
    # for a real shopping question, nowhere near enough to be useful for
    # flooding the agent.
    message: str = Field(min_length=1, max_length=2000)
    user_id: int | None = None
    page_context: PageContext | None = None


class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    products: list[ProductCard] = []


class AgentReply(BaseModel):
    """Structured output the PydanticAI agent returns for every turn."""

    message: str
    product_ids: list[str] = []


class ChatHistoryEntry(BaseModel):
    """
    One stored turn from `chat_messages`, returned by GET /api/chat/history
    so the chat widget can reload a logged-in shopper's past conversation.
    """

    role: str
    content: str
    products: list[ProductCard] = []
    created_at: str
