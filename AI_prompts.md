# AI Prompts Log

This file logs the prompts used while working through HW 4. For each problem: the prompt(s) I typed, and if a follow-up was needed, one sentence on what was lacking in the first prompt.

## Problem 2 — Analyze the database

**Prompt:**
> for problem 2 look at the database data/campus_customs.db and understand the fields of each table. At a minimum understand catalogue, inventory, and users. start the file output/harness.md. write down each table and its fields and one short line on why each field matters for the shop or the chatbot. this harness will keep growing fyi ( models, tools, safety, specs)

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 3 — Build the Campus Customs website

**Prompt:**
> scaffold a react and vite and typscript front end for campus customs. put a nav bar at the top that links to the main pages: home, products, about us, log in, and create account. Pull Campus Customs style wording from yalebulldogblue.com for Home and About Us but write these pages in our voice. our voice is professional but chill and positive. don't copy the original site's text. on the products page show product images from the catalogue (use the image paths in the databsae) with basic product info (name, price, short description). make each product open a sinlge-item page (large image on one side, full product text on the other - description, price, sizes/stock when you have them). clicking a card on products should take the shopper there. add a chat interface in the bottom right of the site ( a floating chat panel is fine). It does not need to talk to an agent yet. a stub that will call the backend later is enough for now. you will need a small API soon to read the db. it's fine to use a FasAPI app for now in backend/main.py to serve products and images. we can grow it to an agent in prob 5.

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 4 — Create account and login

**Prompt:**
> for problem 4 build a normal creat-account/login flow. create account will have first name, last name, email, password (confirm password too). log in will use email and password. new accounts go into the users table. make sure to store passwords securely so human or AI hackers cant access them. Use HASH for this. the seed database already has a test user we can use. Email: test@campuscustoms.yale.edu password: password. we will confirm that we can log in later and that i can create a brand new user next. update output/harness.md with how auth works (what we store for a user and how we protect passwords)

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 5 — PydanticAI agent backend

**Prompt:**
> build the shop chatbot as a pydanticai agent behind FastAPI plugged into your front-end chat widget. put the API app in backend/main.py this is the file to run with Uvicorn. keep the agent as these four files next to it: backend/prompts/prompt.md (system prompt), backend/agent.py (agent entry/wiring), backend/tools.py (tools the agent can call), backend/models.py (pydantic /pydantic AI structured types. in main.py expose a chat route so that a message from the website returns a reply from the agent (and whaterver else you need for products/auth). we will need our AI model API key for the agent. put the campus customs voice and safety basics into prompts/prompt.md (we'll expand tools and safety later). start or update types in models.py for chat replies/product cards as needed. in output/harness.md note how the front end talks to FastAPI and how the agent loads (prompt file + model). Make sure hte backend runs from the backend/ folder like this: uvicorn main:app --reload --port 8000

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 6 — Tools: product info and stock

**Prompt:**
> give the agent tools that look up real information form campus_customs.db: product description, price, how many are in stock (by size when the customer asks). the agent needs to use the database and NEVER invent prices or quantities. if a size is out of stock say so. expand prompts/prompt.md so the agent knows to call these tools for price and stock qustions. add or update return types in models.py. in output/harness.md list each tool and explain which model fields you chose for lookup results and why

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 7 — Chat search that updates the page

**Prompt:**
> now add a neat feature to the site. when a customer asks about a type of item like "what hoodies do u have?"the agent should search the catalgoue and the website should dynamically show those matching items as product cards (image, name, price, short info). this is an API contract: the agent returns structured product matches and then the front end renders them on the website. after the dynamic product cards are loaded by the new feature, make sure the same single item page behavior from problem 3 still works: each product card including the ones the chat just put on the page should still opne that detail view (large image and full info) when clicked. update prompts/prompt.md and output/harness.md so it is clear how search results reach the page. LET'S GO

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 8 — Customer memory

**Prompt:**
> when a shopper is logged in save their chat history in the database in an appropriate table and reload it when they return. the agent should know who is chatting based on the login (name and email). put that in agent deps (or an equiv clear pattern) and/or tools the agent can call. also pass enough page context that if someone is on a product page and asks "do u have this in pink?" the agent know which item they mean. you can put code into agent context. guests can chat too but only logged in users have chat history. document in output/harness.md how user chat history is stored, what customer fields teh agent sees, and how page context is passed.

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 9 — Usability improvements

**Prompt:**
> Now that the core shop works we need to improve it. please suggest 2 front-end and 2 agent/backend improvements. you can use the chat-widget polish you proposed earlier (loading/error states, which turned into an auto-scroll-to-latest-message fix once you checked the code) as one of the improvements. Front end improvements are things that make the site look better and easier to use. agent/backend improvements are things that make the agent output better, more accurate, or safer. these could be new agent tools or things that make the agent run faster or cheaper. write output/usability.md before or as you build. for each improvement say what we added and why it helps campus customs shopper or the business. then double check all improvements actually show up in the running app.

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 10 — Style the website

**Prompt:**
> add a creative design so the site feels like a real campus customs storefront. we need to think about things like fonts, colors, hierarchy, motion, product presentation, chat feel. Write output/design.md with what was changed and why it should help customers stick around and buy. So I can't tell it's a clothing website when I log in. Add a cute bulldog mascot to give us brand identity. Also have a banner that moves at the top that says talk to us, get recs, and figure out what's happening at Campus customs at the top, then a log in and create account link in that banner. similar ideas as join the club to encourage sign ups. Organize the products by category rather than putting them all together and organize the drop down for products too. For products also add categories for affiliations like family, sports, professional schools, residential colleges. don't have a separate home tab, instead clicking on campus customs title also functions as home screen. on the home page add a picture of Yale campus too.

**Follow-up (if needed):**
> actually keep the home tab

*What was lacking:* the original prompt said not to have a separate Home tab (brand title would act as home instead) — walked that back mid-build, so the nav bar kept the Home link alongside the brand mark also linking home.

---

## Problem 11 — Site testing (app check)

**Prompt:**
> test the live site and document it in output/app_check.html (make sure i can double click it open). include screenshots and short captions about 1) chat checking the inventory level of an item (make sure the stock and price are true from the db) 2) the dynamic search results cards appearing after a category questions 3) one of the usability features from prob 9. make sure the html is easy to chefck and grade. it should have headings, screenshots, 1-2 sentences abotu what the screenshot proves. put the screenshot files in output/app_check_images/ and link them from app_check.html with relative paths (for example app_check_images/inventory.png)

**Follow-up (if needed):**
>

*What was lacking:*

---

## Problem 12 — Audit trail, safety, finish harness

**Prompt:**
> keep an append-only output/audit_trail.json of an agent-loop activity (time, tool name, short arguments/result, stop reason). Do not wipe it between runs. also think of some safety rules to give the agent and put them in prompts/prompt.md, like do not trick customers into buying products, don't lie to customers, dont leak passwords, dont offer fake deals, dont track personal info. finish the output/harness.md so it is clear how the system works. Model fields in models.py and why you chose them. tools and abilities. safety rules. specs (loop limits, result caps, models, how to run front and back).

**Follow-up (if needed):**
> are there other safety rules we should add? if so add them and ammend my prompt 12 follow up

*What was lacking:* the first pass covered honesty, privacy/credentials, and scope, but missed a few agent-specific risks: leaking the system prompt itself if asked indirectly, treating tool/catalogue data as untrusted (not following instructions embedded in product text), discussing another customer's account/order/chat history, negotiating or price-matching outside what the tools report, and how to respond if a shopper expresses real distress unrelated to shopping. Added all of these to `prompts/prompt.md`.

**Follow-up 2:**
> are there general safety rules we should follow that we didnt address

*What was lacking:* still missing a couple of things beyond prompt wording — no cap on chat message length (a cost/abuse risk, not just a content one), and no rule for how the agent should handle a shopper being abusive toward *it* (only "don't produce" hateful content existed, not "how to respond to receiving it"), plus no rule against helping with resale/scalping/bulk-automated buying schemes. Added a `max_length` validator to `ChatRequest.message` (`backend/models.py`, mirrored as a frontend `maxLength` for UX) and two new prompt rules. Two other gaps were flagged but deliberately *not* code-fixed here, since fixing them properly is bigger than this problem's scope: (1) `/api/chat`/`/api/chat/history` still trust a client-supplied `user_id` with no real session/auth token — a known, already-documented gap since Problem 4, not something Problem 12's audit/safety work is meant to redo; (2) the audit trail logs a short excerpt of the shopper's own message by design (that's the point of an audit trail), which is a real but inherent privacy tradeoff rather than a bug — documented plainly in `harness.md` instead of papered over.

---

## Problem 13 — GitHub submission

**Prompt:**
>

**Follow-up (if needed):**
> make sure the folder is organized like this and includes AI_prompts.md, requirements.txt, .env.example, and everything else in the screenshot

*What was lacking:* the initial prompt didn't specify the exact folder layout, so I fetched the actual Problem 13 assignment page for the real required structure (root-level `requirements.txt`, `README.md`, `AI_prompts.md`, and the rest) instead of guessing one.
