"""
Tools the Campus Customs shop agent can call to look up real catalogue data.

Every price, description, and stock figure the agent gives a shopper comes
from one of these functions reading data/campus_customs.db directly — never
from the model's own guess. More tools (cart, checkout, order lookup, etc.)
and more safety rules can be layered on later — see output/harness.md.
"""

import json
import sqlite3
import time

from db import get_connection
from models import InventoryLine, Product, ProductCard, StockLookup

# Usability improvement (Problem 9, agent/backend #2 — faster & cheaper):
# the catalogue table (name/price/description/colors/tags) changes far less
# often than inventory counts, but list_all_products/search_products/
# get_product previously re-ran "SELECT * FROM catalogue" on *every* call —
# and a single chat turn often calls search_products then get_product
# several times. Caching the catalogue rows in memory for a short TTL cuts
# that repeated DB round-trip/JSON-parsing work down to roughly one hit per
# minute instead of one per tool call, so the agent responds faster without
# touching how many tokens it uses. Inventory is deliberately NEVER cached
# here — see _inventory_for below — because stock counts are exactly the
# field the agent is required to always report fresh (see prompt.md).
_CATALOGUE_CACHE: list[sqlite3.Row] | None = None
_CATALOGUE_CACHE_LOADED_AT = 0.0
_CATALOGUE_CACHE_TTL_SECONDS = 60.0


def _load_catalogue_rows(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    global _CATALOGUE_CACHE, _CATALOGUE_CACHE_LOADED_AT
    now = time.monotonic()
    if _CATALOGUE_CACHE is None or (now - _CATALOGUE_CACHE_LOADED_AT) > _CATALOGUE_CACHE_TTL_SECONDS:
        _CATALOGUE_CACHE = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
        _CATALOGUE_CACHE_LOADED_AT = now
    return _CATALOGUE_CACHE


def _catalogue_index(conn: sqlite3.Connection) -> dict[str, sqlite3.Row]:
    return {row["product_id"]: row for row in _load_catalogue_rows(conn)}


def _inventory_for(conn: sqlite3.Connection, product_id: str) -> list[InventoryLine]:
    rows = conn.execute(
        "SELECT size, quantity FROM inventory WHERE product_id = ?", (product_id,)
    ).fetchall()
    return [InventoryLine(size=r["size"], quantity=r["quantity"]) for r in rows]


def _to_product(conn: sqlite3.Connection, row: sqlite3.Row) -> Product:
    inventory = _inventory_for(conn, row["product_id"])
    total_stock = sum(line.quantity for line in inventory)
    return Product(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        colors=json.loads(row["colors"]),
        search_tags=json.loads(row["search_tags"]),
        image_url=f"/media/{row['image_file_path']}",
        price=row["price"],
        inventory=inventory,
        total_stock=total_stock,
        in_stock=total_stock > 0,
    )


def _as_card(product: Product) -> ProductCard:
    return ProductCard(
        product_id=product.product_id,
        name=product.name,
        garment_type=product.garment_type,
        price=product.price,
        image_url=product.image_url,
        in_stock=product.in_stock,
    )


def list_all_products() -> list[Product]:
    """Return the full catalogue, used by GET /api/products."""
    conn = get_connection()
    try:
        rows = _load_catalogue_rows(conn)
        return [_to_product(conn, row) for row in rows]
    finally:
        conn.close()


def _search_blob(row: sqlite3.Row) -> str:
    return " ".join(
        [row["name"], row["garment_type"], row["description"], row["colors"], row["search_tags"]]
    ).lower()


def _word_variants(word: str) -> list[str]:
    """
    Singular/plural forms to try for one query word, so "hoodies" still
    matches catalogue text that only says "hoodie" (and vice versa).
    Covers plain -s ("shirts"/"shirt") and -es ("dresses"/"dress"); good
    enough for apparel nouns without pulling in a real stemming library.
    """
    variants = {word}
    if word.endswith("es") and len(word) > 4:
        variants.add(word[:-2])
    if word.endswith("s") and len(word) > 3:
        variants.add(word[:-1])
    if not word.endswith("s"):
        variants.add(word + "s")
    return list(variants)


def _word_in_blob(word: str, blob: str) -> bool:
    return any(variant in blob for variant in _word_variants(word))


def search_products(query: str, limit: int = 12) -> list[ProductCard]:
    """
    Search the catalogue by keyword(s) across name, garment type,
    description, colors, and search tags.

    The query is split into individual words rather than matched as one
    literal phrase (a query like "navy Yale hoodie" won't appear verbatim
    in any single field, but a product whose name/colors/tags separately
    contain "navy", "yale", and "hoodie" should still match). Each word is
    matched via _word_in_blob, which also tries its singular/plural form
    (a shopper or the agent saying "hoodies" should still match catalogue
    text that only ever says "hoodie"). Tries an AND match first (every
    word present); if that's too strict and finds nothing, falls back to
    an OR match (any word present).

    Returns lightweight product cards (not full descriptions). As of
    Problem 7, these are what gets rendered as real product cards on the
    website (not just named in the chat reply), so the limit is set a bit
    higher than a short chat list would need — enough to feel like a real
    results page for a category browse like "what hoodies do you have?".
    """
    words = [w for w in query.lower().split() if w]
    conn = get_connection()
    try:
        rows = _load_catalogue_rows(conn)
        if not words:
            matches = rows
        else:
            blobs = {row["product_id"]: _search_blob(row) for row in rows}
            matches = [
                row for row in rows if all(_word_in_blob(w, blobs[row["product_id"]]) for w in words)
            ]
            if not matches:
                matches = [
                    row for row in rows if any(_word_in_blob(w, blobs[row["product_id"]]) for w in words)
                ]
        return [_as_card(_to_product(conn, row)) for row in matches[:limit]]
    finally:
        conn.close()


def get_product(product_id: str) -> Product | None:
    """Look up full detail (description, colors, per-size stock) for one product by its id."""
    conn = get_connection()
    try:
        row = _catalogue_index(conn).get(product_id)
        if row is None:
            return None
        return _to_product(conn, row)
    finally:
        conn.close()


def recommend_alternatives(product_id: str, limit: int = 4) -> list[ProductCard]:
    """
    Find other in-stock products to suggest when `product_id` (or one of
    its sizes) is out of stock, so the agent can offer a real alternative
    instead of just saying "sorry, no." Prefers other products of the same
    `garment_type` (e.g. other hoodies); if none of those are in stock
    either, falls back to products sharing a `search_tags` keyword with the
    original. Every candidate is checked against real inventory via
    `_to_product`, so a suggestion is never something that's itself out of
    stock — always grounded in the current catalogue, never invented.
    """
    conn = get_connection()
    try:
        index = _catalogue_index(conn)
        target = index.get(product_id)
        if target is None:
            return []

        rows = _load_catalogue_rows(conn)
        same_type = [
            row
            for row in rows
            if row["product_id"] != product_id and row["garment_type"] == target["garment_type"]
        ]
        candidates = same_type
        if not candidates:
            target_tags = set(json.loads(target["search_tags"]))
            candidates = [
                row
                for row in rows
                if row["product_id"] != product_id
                and target_tags & set(json.loads(row["search_tags"]))
            ]

        alternatives: list[ProductCard] = []
        for row in candidates:
            product = _to_product(conn, row)
            if product.in_stock:
                alternatives.append(_as_card(product))
            if len(alternatives) >= limit:
                break
        return alternatives
    finally:
        conn.close()


def check_size_stock(product_id: str, size: str) -> StockLookup:
    """
    Check real-time stock for one product + size from the inventory table.

    Distinguishes "we don't offer this size" (size_offered=False) from
    "we offer it but it's sold out" (size_offered=True, quantity=0) — see
    StockLookup in models.py for why that distinction is a separate field
    rather than left for the agent to infer.
    """
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT quantity FROM inventory WHERE product_id = ? AND lower(size) = ?",
            (product_id, size.lower()),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return StockLookup(product_id=product_id, size=size, size_offered=False)

    quantity = row["quantity"]
    return StockLookup(
        product_id=product_id,
        size=size,
        size_offered=True,
        quantity=quantity,
        in_stock=quantity > 0,
    )
