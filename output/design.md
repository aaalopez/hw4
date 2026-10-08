# Design (Problem 10 — Style the Website)

A creative pass across typography, color, motion, product presentation, chat feel, navigation, and brand identity — so the site reads as a real Campus Customs storefront rather than a generic scaffold. Each change below says what we added and why it should help a shopper stick around and actually buy.

---

## Type & color system

**What we added:** `index.css` now defines two font families — **Oswald** (bold, condensed, collegiate/varsity — used for all headings, the nav brand, and category labels) and **Inter** (clean, highly readable — used for body copy), loaded via Google Fonts in `index.html`. The color palette grew from just `--yale-blue`/`--yale-gold` to include `--yale-blue-dark`, `--yale-blue-light`, and a warm `--cream` page background (replacing a flat light-gray), plus `scroll-behavior: smooth` and a `prefers-reduced-motion` override so every animation added below backs off for anyone who needs that.

**Why it helps:** a website's sense of legitimacy forms in milliseconds, before anyone reads a word of copy — a shopper who registers "generic template" is more likely to bounce before seeing a single product, and more hesitant to hand over payment info even if they stay. Oswald's collegiate-athletic weight reads as "official Yale gear" before the page even finishes loading, and the cream background raises the contrast against navy/gold enough that the product photography — the thing that actually closes a sale — looks intentional instead of washed out.

---

## Brand mascot — "Blue" the bulldog

**What we added (current design):** `BulldogMascot.tsx` is a hand-drawn flat-vector SVG of an actual sitting bulldog — not a standing humanoid figure — wearing a navy Yale bandana tied around its neck. It shares its face exactly with the chat launcher (`ChatBulldog.tsx`): a big round white head, floppy brown "patch" ears, a brown patch over one eye, and a wink. The body is stout and compact (wide sitting torso, short/no visible neck, two front paws, one paw painted brown to match the ear/eye patches) rather than tall or muscular. It's used in five places: the nav bar brand mark, the home page hero, the chat widget header and every assistant message's avatar, and the top of both auth forms. Built as inline SVG rather than a fetched image — no image-generation tool was available in this session, confirmed by testing the project's own Portkey API key against an image-generation endpoint (it failed, routed to a chat-only model) — so the mascot is entirely hand-coded shapes, crisp at any size and themeable via the site's own CSS color variables.

**Why it helps:** one consistent character across the whole site — including the login/signup pages, which previously had zero clothing-brand identity — does more for "feels like a real storefront" than any banner, and gives the chat assistant a face instead of a form field.

---

## Yale campus illustration

**What we added:** `CampusSkyline.tsx` — a flat-vector illustration of Yale's Collegiate Gothic skyline (a Harkness-Tower-style spire with pointed-arch windows and crenellations, flanked by gabled halls), used as a full-width banner on the Home page under the hero, with the heading "Made for New Haven, worn everywhere." overlaid.

**Why it helps:** college apparel buyers — especially alumni and parents, a big share of this catalogue's "Family" and "Residential Colleges" items — are buying affiliation and memory as much as fabric. Grounding the brand in Yale's actual architecture, instead of a generic hero banner, reinforces "this is really Yale" for exactly the audience most likely to buy on emotional connection rather than garment specs. Doing it as an illustration rather than a fetched photo also sidesteps licensing risk from an unverified image source.

---

## Moving top announcement banner

**What we added:** `AnnouncementBar.tsx`, mounted above the nav bar on every page. A continuously scrolling marquee cycles three messages, each covering one angle (talk to the chat assistant, get recs, see what's new at the shop), and, for guests, **Log In** / **Join the Bulldog Club** links live in the same bar (moved out of the nav bar entirely, since repeating them in two places would be clutter). Logged-in shoppers see just the marquee (no need to nudge them to sign up again).

**Why it helps:** prime real estate — the first thing anyone sees — doing double duty as a chat nudge and a soft, perk-framed sign-up prompt, which drives more shoppers into the saved-history/recommendations experience from Problem 8.

---

## Navigation: Products dropdown + category-organized catalogue

**What we added:** `categories.ts` defines five shopper-facing garment-type buckets — **Hoodies**, **Jackets & Fleece**, **T-Shirts**, **Crewnecks & Sweatshirts**, **More Favorites** — built from keyword matching over the database's `garment_type` field (which has ~20 near-duplicate raw values like "short-sleeve t-shirt" vs. "short-sleeve T-shirt" vs. "heavyweight short-sleeve t-shirt" that would've made for a messy, repetitive menu if grouped literally). The nav bar's "Products" link is now a hover dropdown listing these categories (plus "All Products"); clicking one goes to `/products?category=hoodies`. The Products page itself, when no category or chat search is active, now renders the full catalogue as these same category sections with headings, instead of one flat 102-item grid.

**Affiliation categories (a second, independent way to browse):** the same file also defines `AFFILIATION_CATEGORIES` — **Family**, **Sports**, **Professional Schools**, **Residential Colleges** — listed in the nav dropdown under a "Shop by Affiliation" divider, using the same `?category=` link/filter mechanism. These match against a product's **name and search tags** instead of `garment_type`, since garment type carries no information about who or what a product is *for*. Unlike the garment-type buckets, a product can belong to more than one affiliation bucket at once (there's no "first match wins" — a "Yale Dad Hoodie" is Family regardless of also being a Hoodie), though in this catalogue no product currently matches more than one affiliation.

**Why it helps:** a shopper who wants a hoodie finds it in one click instead of scrolling a flat grid. Affiliation categories surface a different real intent garment type can't — a parent shopping "Dad," an alum looking for their residential college — without needing the right words to type into the chat.

---

## Chat widget "feel"

**What we added:** the floating launcher button is a custom `ChatBulldog` icon — a sitting, winking bulldog puppy — with a speech bubble reading "How can I help!?" next to it whenever the chat is closed. On top of Problem 9's auto-scroll fix, the opened panel pops in with a short scale/fade animation instead of just appearing; the header uses the brand font and gradient; every assistant message gets the bulldog avatar next to its bubble; the "thinking" state is three bouncing dots instead of a static "…"; message bubbles fade/slide in individually; and the input/send button were restyled to rounded pill inputs matching the rest of the site's buttons.

**Why it helps:** the chat assistant is this assignment's centerpiece (Problems 5–9) — it should feel alive and considered, not bolted on, which matters for whether a hesitant shopper bothers typing a question at all.

---

## Paw-print cursor trail

**What we added:** `PawTrail.tsx`, mounted once at the app root. As the cursor moves, it leaves a fading trail of small paw prints that alternate left/right like footsteps, distance-gated so it stays light-weight regardless of how fast the mouse moves, and skipped entirely under `prefers-reduced-motion`. The default arrow is also swapped for a small paw-print cursor over plain page areas (buttons/links keep their own cursor).

**Why it helps:** brand affinity that drives *repeat* purchases usually comes from small delight details more than big banners — a shopper absorbs the mascot through hundreds of ambient cursor movements per visit, not just the one moment they notice the nav icon or open the chat. It costs nothing against the actual shopping task (purely decorative, `pointer-events: none`, skipped under `prefers-reduced-motion`) while extending the one consistent mascot to literally every interaction on the site, not just the obvious touchpoints.
