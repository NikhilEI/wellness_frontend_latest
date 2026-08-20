# Wellness India Expo — `latest`

Next.js (App Router) port of the `staging/` static site. It is generated to be an
exact copy — same markup, same styling, same script behavior — not a redesign.

## How it works

- `staging/*.html` pages are not hand-converted to JSX. Instead
  `scripts/extract-legacy-pages.js` parses each page and produces
  `src/legacy-content/*.ts`, each exporting:
  - `meta` — title / description / keywords for that page
  - `html` — the page's `<body>` markup (HTML comments and out-of-band script
    tags stripped, internal page links and asset paths rewritten to be
    root-absolute so they work under Next's routing)
  - `scripts` — every `<script>` from that page, in original order, as either
    `{ type: "src", src, async }` or `{ type: "inline", code }`
- `src/legacy/LegacyPage.tsx` (a Client Component) injects `html` via
  `dangerouslySetInnerHTML`, then on mount loads the vendor scripts
  sequentially (respecting `async`) and runs the inline scripts in order,
  then re-dispatches synthetic `DOMContentLoaded`/`load` events — the real
  ones already fired before hydration, so any legacy code waiting on them
  needs this to actually run.
- `src/app/layout.tsx` carries every `<head>` tag common to all five pages
  (fonts, Bootstrap, AOS, owlcarousel, FontAwesome, `my-style.css`, favicon).
- Static assets (`css/`, `js/`, `images/`, `fonts/`, `aos/`, `owlcarousel/`,
  `video-2026/`, `pdf/`) were copied from `staging/` into `public/` as-is.
  `staging/_next/` was **not** copied — it's ~19MB of unused leftover
  Next.js build output, not referenced by any CSS or HTML.

Routes: `/` (default.html), `/space-booking`, `/response`,
`/response-newsletter`, `/exhibitor-profile`.

## Live forms

Two forms are wired to the Node/MySQL backend in `../backend` (see its README
for setup/migration):

- **Newsletter signup** (footer, on `/`, `/space-booking`, `/response`,
  `/response-newsletter`) — `extract-legacy-pages.js` gives the form an
  `id="newsletterForm"` and a message slot; `staging.html`'s original markup
  otherwise did a plain `GET` to a static page and saved nothing.
- **Space booking** (`/space-booking`) — staging's fields weren't wrapped in a
  `<form>` at all (submit was just an `<a href="response.html">` around the
  button). `extract-legacy-pages.js` wraps the fields in a real
  `<form id="spaceBookingForm">` so it can be validated and posted.

`src/components/SiteForms.tsx` (mounted once, globally, from the root layout)
finds these forms by id, validates, `POST`s JSON to
`NEXT_PUBLIC_API_BASE_URL` (see `.env.local`, defaults to
`http://localhost:4000/api`), and redirects to `/response-newsletter` or
`/response` on success. Make sure the backend's `CORS_ORIGIN` includes
whatever origin this app runs on (`.env.example` there already lists
`localhost:3000`/`:3100`).

## Re-running the port after staging changes

```
node scripts/extract-legacy-pages.js
```

Re-copy any changed files under `staging/css`, `staging/images`, etc. into
`public/` as needed — the script only regenerates `src/legacy-content/*.ts`.

## Known as-is quirks (carried over from staging, not introduced here)

- A handful of nav links point to `*.aspx` pages that don't exist on this
  site (leftovers from the larger corporate site staging was cloned from).
- `lightbox/`, `gallery-src/`, and `js/masonry.pkgd.min.js` are referenced
  but don't exist as files in `staging/` either — those features are
  already non-functional in staging.
- The space-booking form's reCAPTCHA is a frozen, non-functional markup
  snapshot in staging (no live `recaptcha/api.js` is loaded); preserved as-is
  and not required by `SiteForms.tsx`'s validation.

## Development

```
npm install
npm run dev
```

## Production build

```
npm run build
npm start
```
