# Campus Customs — Yale Apparel Shop + Shop Assistant Agent

A full-stack shop (React/Vite/TypeScript frontend, FastAPI backend) with a
PydanticAI shop-assistant agent wired into a floating chat widget. See
`output/harness.md` for how the system works in depth, `output/design.md`
for the site's visual/UX design pass, `output/usability.md` for the
Problem 9 improvements, and `output/app_check.html` for a screenshotted
walkthrough of the live app.

The agent itself is four files under `backend/`: `prompts/prompt.md`
(system prompt), `agent.py` (wiring/tools registration), `tools.py`
(the database-backed functions it can call), and `models.py` (the
Pydantic/PydanticAI structured types everything shares).

## Before you start: place the data pack

The real database and product photos are **not** committed to this repo
(see `.gitignore`) — they're excluded on purpose. Get `campus_customs.db`
and the `products/` image folder from whoever provided this assignment's
data pack, then place them here, matching this layout exactly:

```
data/
├── campus_customs.db
└── products/
    ├── <product-image-1>.jpg
    ├── <product-image-2>.jpg
    └── ...
```

Nothing in `backend/` or `frontend/` will run correctly without this —
`backend/db.py` points at `data/campus_customs.db`, and product images
are served from `data/products/`.

## Setup

**1. Environment variables**

```bash
cp .env.example .env
```

Then edit `.env` and fill in a real `PORTKEY_API_KEY` (the chat agent
won't start without one — see `backend/agent.py`). `PORTKEY_MODEL` and
`PORTKEY_BASE_URL` are optional; the defaults in `.env.example` work as-is.

**2. Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs the FastAPI app at `http://127.0.0.1:8000`. Must be started from
*inside* `backend/` — see the note in `output/harness.md`'s "Backend
layout" section for why (it's how the course setup expects imports to
resolve).

**3. Frontend**

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Vite's dev server proxies `/api` and
`/media` requests to the backend at `:8000` (see `frontend/vite.config.ts`),
so both need to be running at once for the site to actually work.

**4. Try it**

- Browse products, open a product detail page, use the chat widget
  (bottom-right) to ask about sizes/colors/stock.
- A seeded test account exists once the real data pack is in place:
  `test@campuscustoms.yale.edu` / `password`.

## Project structure

```
hw4/
├── AI_prompts.md          # prompt log for every problem in this assignment
├── requirements.txt        # backend Python dependencies
├── .env.example
├── .gitignore
├── README.md
├── frontend/               # Vite + React + TypeScript app
├── backend/
│   ├── main.py             # FastAPI app — run: uvicorn main:app --reload --port 8000
│   ├── agent.py             # agent wiring (model, tools, deps, audit logging)
│   ├── models.py            # shared Pydantic / PydanticAI types
│   ├── tools.py              # the agent's database-backed tools
│   ├── audit.py               # append-only agent-loop audit log
│   ├── auth.py                 # password hashing (signup/login)
│   ├── db.py                    # shared sqlite connection helper
│   └── prompts/
│       └── prompt.md             # the agent's system prompt
└── output/
    ├── harness.md           # full system architecture write-up
    ├── design.md             # Problem 10 design write-up
    ├── usability.md           # Problem 9 usability write-up
    ├── app_check.html          # Problem 11 — screenshotted live-app walkthrough
    ├── app_check_images/        # screenshots linked from app_check.html
    └── audit_trail.json          # Problem 12 — append-only agent-loop log
```

(`data/` — the real `campus_customs.db` and `products/` image folder —
is intentionally not part of this repo; see "Before you start" above.)
