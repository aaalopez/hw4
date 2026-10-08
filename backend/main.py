"""
Campus Customs API

Serves product + inventory data, handles signup/login, and exposes the
shop assistant chat endpoint (backend/agent.py).

Run from inside the backend/ folder:
    uvicorn main:app --reload --port 8000
"""

import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import agent as shop_agent
import tools as shop_tools
from auth import hash_password, verify_password
from db import ROOT_DIR, get_connection
from models import (
    AgentReply,
    AuthUser,
    ChatHistoryEntry,
    ChatRequest,
    ChatResponse,
    LoginRequest,
    Product,
    ProductCard,
    SignupRequest,
)

# How many recent turns to replay into the model as conversation context.
# Keeps token usage bounded; the full history is still available via
# GET /api/chat/history for the UI to reload and display.
CHAT_HISTORY_WINDOW = 20

app = FastAPI(title="Campus Customs API")

# The Vite dev server runs on 5173 by default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve product photos at /media/products/<file>.jpg
app.mount("/media", StaticFiles(directory=str(ROOT_DIR / "data")), name="media")


# --- Products ----------------------------------------------------------------


@app.get("/api/products", response_model=list[Product])
def list_products():
    return shop_tools.list_all_products()


@app.get("/api/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    product = shop_tools.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- Auth ----------------------------------------------------------------------


def _public_user(row) -> AuthUser:
    """User fields that are safe to send to the frontend (never password_hash)."""
    return AuthUser(
        id=row["id"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        email=row["email"],
    )


@app.post("/api/auth/signup", response_model=AuthUser, status_code=201)
def signup(payload: SignupRequest):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    email = payload.email.lower()
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        full_name = f"{payload.first_name} {payload.last_name}"
        password_hash = hash_password(payload.password)

        cur = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (full_name, email, password_hash, payload.first_name, payload.last_name),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    finally:
        conn.close()

    return _public_user(row)


@app.post("/api/auth/login", response_model=AuthUser)
def login(payload: LoginRequest):
    email = payload.email.lower()
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()
    finally:
        conn.close()

    # Same error for "no such user" and "wrong password" so we don't reveal
    # which part was wrong (avoids leaking which emails have accounts).
    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return _public_user(row)


# --- Chat ----------------------------------------------------------------------


def _log_chat_turn(user_id: int, role: str, content: str, products: list[ProductCard]) -> None:
    conn = get_connection()
    try:
        products_json = json.dumps([p.model_dump() for p in products]) if products else None
        conn.execute(
            """
            INSERT INTO chat_messages (user_id, role, content, products_json)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, role, content, products_json),
        )
        conn.commit()
    finally:
        conn.close()


def _load_recent_messages(user_id: int, limit: int | None = None):
    """
    Raw chat_messages rows for one user, oldest first. With a limit, grabs
    the most recent N rows (for feeding the model as conversation context)
    then re-sorts them chronologically; without one, returns everything
    (for the UI to reload and display in full).
    """
    conn = get_connection()
    try:
        if limit is None:
            rows = conn.execute(
                "SELECT role, content, products_json, created_at FROM chat_messages "
                "WHERE user_id = ? ORDER BY id ASC",
                (user_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT role, content, products_json, created_at FROM chat_messages "
                "WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
            rows = list(reversed(rows))
    finally:
        conn.close()
    return rows


def _customer_deps(payload: ChatRequest) -> shop_agent.ChatDeps:
    """
    Build the agent's per-request deps: who's chatting (if logged in, by
    name and email — nothing more sensitive) and what page they're on.
    """
    first_name = last_name = email = None
    if payload.user_id is not None:
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT first_name, last_name, email FROM users WHERE id = ?",
                (payload.user_id,),
            ).fetchone()
        finally:
            conn.close()
        if row is not None:
            first_name, last_name, email = row["first_name"], row["last_name"], row["email"]

    return shop_agent.ChatDeps(
        user_id=payload.user_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        page_context=payload.page_context,
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    deps = _customer_deps(payload)

    # Only logged-in shoppers get conversation memory — chat_messages.user_id
    # is NOT NULL, so guests were never persisted in the first place.
    message_history = None
    if payload.user_id is not None:
        recent_rows = _load_recent_messages(payload.user_id, limit=CHAT_HISTORY_WINDOW)
        message_history = shop_agent.build_message_history(recent_rows)

    try:
        reply: AgentReply = await shop_agent.run_chat(
            payload.message, deps=deps, message_history=message_history
        )
    except RuntimeError as exc:
        # e.g. PORTKEY_API_KEY missing from .env
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=502, detail="The shop assistant is having trouble right now. Try again shortly."
        )

    products: list[ProductCard] = []
    for product_id in reply.product_ids:
        product = shop_tools.get_product(product_id)
        if product is not None:
            products.append(
                ProductCard(
                    product_id=product.product_id,
                    name=product.name,
                    garment_type=product.garment_type,
                    price=product.price,
                    image_url=product.image_url,
                    in_stock=product.in_stock,
                )
            )

    # Only persist to chat_messages when we know who's chatting — the
    # column is NOT NULL and we don't want to force a login just to chat.
    if payload.user_id is not None:
        _log_chat_turn(payload.user_id, "user", payload.message, [])
        _log_chat_turn(payload.user_id, "assistant", reply.message, products)

    return ChatResponse(content=reply.message, products=products)


def _product_card_from_json(data: dict) -> ProductCard | None:
    """
    Parse one product dict from a stored chat_messages.products_json blob.
    Tolerant of the richer, pre-Problem-7 snapshot shape (which carries
    extra fields like inventory/total_stock but no explicit `in_stock`
    boolean) as well as the current ProductCard shape — so old seeded
    conversations don't break the history endpoint.
    """
    try:
        return ProductCard(
            product_id=data["product_id"],
            name=data["name"],
            garment_type=data.get("garment_type", ""),
            price=data["price"],
            image_url=data.get("image_url") or f"/media/{data.get('image_file_path', '')}",
            in_stock=data.get("in_stock", data.get("total_stock", 1) > 0),
        )
    except (KeyError, TypeError):
        return None


@app.get("/api/chat/history", response_model=list[ChatHistoryEntry])
def chat_history(user_id: int):
    """
    Full stored conversation for a logged-in shopper, so the chat widget
    can reload it when they return. Returns an empty list for a user with
    no prior messages (including one that doesn't exist) rather than 404 —
    "no history yet" isn't an error.
    """
    rows = _load_recent_messages(user_id, limit=None)
    entries = []
    for row in rows:
        products_data = json.loads(row["products_json"]) if row["products_json"] else []
        cards = [_product_card_from_json(p) for p in products_data]
        entries.append(
            ChatHistoryEntry(
                role=row["role"],
                content=row["content"],
                products=[c for c in cards if c is not None],
                created_at=row["created_at"],
            )
        )
    return entries


@app.get("/api/health")
def health():
    return {"status": "ok"}
