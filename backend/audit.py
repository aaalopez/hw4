"""
Problem 12: append-only audit trail of agent-loop activity.

Every /api/chat call appends one line per tool the agent invoked during
that turn, plus one summary line for the turn itself, to
output/audit_trail.json. Each line is its own self-contained JSON object
(JSON Lines format) rather than one big JSON array — that's what makes
"append-only" actually possible: a JSON array would need the whole file
re-read and re-written (to fix the closing `]`) every single time, where
JSON Lines only ever needs `open(..., "a")` and one `write()`. The file is
never opened in write/truncate mode anywhere in this codebase, and nothing
deletes or resets it between runs or server restarts.
"""

import json
import time
from pathlib import Path
from typing import Any

from pydantic_ai.agent import AgentRunResult
from pydantic_ai.messages import ModelResponse, ToolCallPart, ToolReturnPart

AUDIT_PATH = Path(__file__).resolve().parent.parent / "output" / "audit_trail.json"

# Short arguments/results, per the spec — a full product list or a long
# description would bloat the log and bury the part that actually matters
# (which tool, roughly what with, what came back).
_MAX_FIELD_LENGTH = 300


def _short(value: Any, limit: int = _MAX_FIELD_LENGTH) -> str:
    text = value if isinstance(value, str) else json.dumps(value, default=str)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _append(entry: dict) -> None:
    record = {"time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **entry}
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with AUDIT_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, default=str) + "\n")


def log_agent_run(result: AgentRunResult, *, user_id: int | None, message: str) -> None:
    """
    Call once after a successful `agent.run()`. Walks the run's full
    message history, pairs each tool call with its matching result (by
    `tool_call_id`, since the call and its return arrive in different
    messages), and logs one line per tool invocation in the order they
    happened, then one summary line for the whole turn.
    """
    calls: dict[str, dict] = {}
    order: list[str] = []

    for msg in result.all_messages():
        for part in msg.parts:
            if isinstance(part, ToolCallPart):
                calls[part.tool_call_id] = {"tool": part.tool_name, "arguments": _short(part.args)}
                order.append(part.tool_call_id)
            elif isinstance(part, ToolReturnPart) and part.tool_call_id in calls:
                calls[part.tool_call_id]["result"] = _short(part.content)

    for call_id in order:
        entry = calls[call_id]
        _append(
            {
                "user_id": user_id,
                "tool": entry.get("tool"),
                "arguments": entry.get("arguments"),
                "result": entry.get("result", "(no result captured)"),
                "stop_reason": None,
            }
        )

    _append(
        {
            "user_id": user_id,
            "tool": None,
            "arguments": _short(message, 120),
            "result": f"{len(order)} tool call(s)",
            "stop_reason": "completed",
        }
    )


def log_agent_error(exc: Exception, *, user_id: int | None, message: str, stop_reason: str) -> None:
    """Call when `agent.run()` raises — e.g. a usage-limit breach or a model/tool error."""
    _append(
        {
            "user_id": user_id,
            "tool": None,
            "arguments": _short(message, 120),
            "result": f"{type(exc).__name__}: {_short(str(exc), 150)}",
            "stop_reason": stop_reason,
        }
    )
