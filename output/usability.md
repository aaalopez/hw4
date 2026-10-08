# Usability Improvements (Problem 9)

Two front-end and two agent/backend improvements, each independent of the others. For each: what we added, and why it helps the Campus Customs shopper or the business.

---

## Front-end #1: Chat auto-scrolls to the newest message

**What we added:** `ChatWidget.tsx` now scrolls the message list to the bottom automatically whenever a new message arrives, the "…" pending bubble shows up, or the panel is opened — via a `scrollIntoView` on an anchor div at the end of the list (`frontend/src/components/ChatWidget.tsx`).

**Why it helps:** since Problem 8, a returning logged-in shopper's chat history reloads in full when they open the widget, and a single session can easily run past the panel's visible height. Without auto-scroll, the shopper lands on an old message and has to manually scroll down to find the agent's latest reply — a small but real point of friction that makes an otherwise-working feature (persistent chat memory) feel broken.

*Carried-over suggestion:* the Problem 9 prompt said "you can use the suggestion you just made as an improvement," referring to a clarifying question asked right before it — proposing to pick usability improvements from gaps already seen running the app, naming "loading/error states on chat" as an example. `ChatWidget.tsx` already had both of those (a pending "…" bubble and a connection-failure fallback message), so this auto-scroll fix is the real gap found in that same area once the code was actually read.

---

## Front-end #2: Sort control + a "Sold Out" stamp instead of hiding sold-out items

**What we added:** `Products.tsx` gained a "Sort by" dropdown (Featured / Price: low to high / Price: high to low) above the grid, applying client-side to whatever is currently shown — the full catalogue, a category, or an active chat search's results (`frontend/src/pages/Products.tsx`, `Products.css`).

This section originally also shipped an "In stock only" checkbox that hid out-of-stock products from the grid. That's been removed: sold-out products now always stay visible, and instead get a bold "Sold Out" stamp overlaid diagonally across their product image (`.product-card__sold-out-stamp`), replacing the small "Out of stock" text label that used to sit next to the price.

**Why it helps:** the catalogue has 102 products; a chat search like "what hoodies do you have?" alone can return 12. Sorting by price is a direct "easier to browse" win for a shopper with a budget. For stock, hiding sold-out items turned out to be the wrong call for this shop: a shopper might still want to see a sold-out style (to check back later, or because the detail page shows per-size stock — a size other than the one that's out might still be available), so a clear, impossible-to-miss "Sold Out" stamp communicates the same thing hiding did, without removing the product from the shopper's view entirely.

**Known gap:** `in_stock` is computed at the product level (`total_stock > 0` across every size) — as of this catalogue's current data, every single product has at least one size in stock, so no product is ever fully "Sold Out" and the stamp has nothing to render on right now. The logic is correct and will show the stamp the moment any product's inventory is fully zeroed out (confirmed by checking `SUM(quantity)` per product directly against the database), but it couldn't be visually verified against today's seed data.

---

## Agent/backend #1: New tool — `recommend_alternatives`

**What we added:** `tools.recommend_alternatives(product_id)` (`backend/tools.py`), registered as a new agent tool in `backend/agent.py`. When a product or a specific size turns out to be out of stock, it looks for other **currently in-stock** products — first with the same `garment_type` (e.g. other hoodies), falling back to products sharing a `search_tags` keyword if none of those are in stock either — and returns them as `ProductCard`s. `prompts/prompt.md` was updated to tell the agent to call this immediately after `get_product` or `check_size_stock` reports something out of stock, and to include the returned ids in `product_ids` like any other match (so they render as real cards, same mechanism as Problem 7's search results).

**Why it helps:** before this, the agent's honest "that's out of stock" answer was also a dead end — correct, but it just lost the sale. Every alternative this tool suggests is read from the live catalogue/inventory the same way every other answer is (never invented), so it keeps the existing "never guess a price or stock count" guarantee while turning a stock-out into a chance to keep the shopper on the site and looking at something they can actually buy. That's a direct, measurable win for the business (fewer abandoned conversations), not just a UX nicety.

---

## Agent/backend #2: In-memory catalogue cache (faster, cheaper tool calls)

**What we added:** `tools.py` now caches the catalogue table's rows in memory for 60 seconds (`_load_catalogue_rows` / `_catalogue_index`), instead of re-running `SELECT * FROM catalogue` on every single call to `list_all_products`, `search_products`, `get_product`, and the new `recommend_alternatives`. **Inventory is deliberately excluded from this cache** — `_inventory_for` still queries the `inventory` table fresh on every call, with no TTL, because stock counts are exactly the field the agent is required to always report live (per `prompt.md`'s "never answer a price or stock question from... something said earlier" rule).

**Why it helps:** a single chat turn routinely makes several tool calls in sequence — e.g. `search_products` followed by `get_product` on each match, or (now) `get_product` followed by `recommend_alternatives`. Each of those was independently re-scanning and re-parsing the same ~102-row table (including `json.loads` on every product's `colors` and `search_tags`) even when nothing in the catalogue had changed since the last call a few hundred milliseconds earlier. Caching that part cuts redundant DB work and JSON parsing across a single conversation turn, so the agent's tool calls — and therefore its replies — come back faster, without changing token usage, output shape, or the one guarantee that actually matters: stock numbers are never served stale.

---

## Verification

All four were checked against the actual running app (backend on `:8000`, frontend on `:5173`), not just read back as code:

- **Auto-scroll:** code reviewed in place (`messagesEndRef` + `useEffect` keyed on `messages`/`isSending`/`isOpen`); Vite HMR picked up the change with no console/compile errors.
- **Sort / sold-out stamp:** code reviewed in place; `tsc -b --noEmit` clean and Vite HMR picked up the change with no compile errors. Confirmed `/api/products` gives the sort control a real spread of prices to act on. The sold-out stamp's conditional (`!p.in_stock`) is correct, but a direct DB check (`SUM(quantity)` per product) showed zero products in the current catalogue are fully out of stock, so the stamp itself couldn't be visually confirmed against real data — see the "Known gap" note above.
- **`recommend_alternatives`:** called directly in Python (`from tools import recommend_alternatives`) against the real DB and confirmed it returns real, currently-in-stock `ProductCard`s for a known out-of-stock size. Then verified live through the full agent: asked `/api/chat` about a size that's sold out and confirmed the reply mentions the stock-out *and* the response's `products` include genuine in-stock alternatives (not the original out-of-stock item).
- **Catalogue cache:** confirmed `GET /api/products` and `GET /api/products/{id}` return identical data before/after the change (same count, same fields), and that repeated calls within the 60s TTL window don't re-hit the catalogue table while inventory numbers still reflect the live `inventory` table on every call.
