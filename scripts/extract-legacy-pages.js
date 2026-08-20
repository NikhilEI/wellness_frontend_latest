// One-off codegen: turns each staging/*.html page into a body-markup + ordered
// script-list pair under src/legacy-content, for exact-fidelity rendering via LegacyPage.
const fs = require("fs");
const path = require("path");

const STAGING_DIR = path.join(__dirname, "..", "..", "staging");
const OUT_DIR = path.join(__dirname, "..", "src", "legacy-content");

const PAGES = [
  { file: "default.html", name: "default" },
  { file: "space-booking.html", name: "spaceBooking" },
  { file: "response.html", name: "response" },
  { file: "response-newsletter.html", name: "responseNewsletter" },
  { file: "exhibitor-profile.html", name: "exhibitorProfile" }
];

const PAGE_ROUTE_MAP = {
  "default.html": "/",
  "space-booking.html": "/space-booking",
  "response.html": "/response",
  "response-newsletter.html": "/response-newsletter",
  "exhibitor-profile.html": "/exhibitor-profile"
};

const ASSET_PREFIXES = [
  "css/",
  "js/",
  "images/",
  "fonts/",
  "aos/",
  "owlcarousel/",
  "video-2026/",
  "pdf/",
  "lightbox/"
];

function resolveAssetPath(value) {
  if (PAGE_ROUTE_MAP[value]) return PAGE_ROUTE_MAP[value];
  if (value === "favicon.ico") return "/favicon.ico";
  if (/^(https?:|mailto:|tel:|#|\/)/.test(value)) return value;
  if (ASSET_PREFIXES.some((prefix) => value.startsWith(prefix))) return `/${value}`;
  return value;
}

function rewritePaths(html) {
  return html.replace(/(src|href|poster|action)="([^"]*)"/g, (match, attr, value) => {
    const resolved = resolveAssetPath(value);
    return resolved === value ? match : `${attr}="${resolved}"`;
  });
}

// Newsletter form ships with no id/required/message-slot in staging, and posts nowhere
// real (GET to a static page). Give it the hooks SiteForms.tsx needs to submit for real.
function activateNewsletterForm(html) {
  const formRe = /<form method="GET" action="\/response-newsletter" class="newsletter-form">[\s\S]*?<\/form>/;
  return html.replace(formRe, (match) => {
    let updated = match.replace(
      'class="newsletter-form">',
      'class="newsletter-form" id="newsletterForm">'
    );
    updated = updated.replace(
      '<input type="email" name="EMAIL" id="email" placeholder="Enter Your email address" class="form-control">',
      '<input type="email" name="EMAIL" id="email" placeholder="Enter Your email address" class="form-control" required>'
    );
    updated = updated.replace(
      "</form>",
      // .newsletter-form is position:relative with its submit button pinned via
      // position:absolute; bottom:4px. A normal-flow message div here would grow the
      // container and drag the button down with it, so this stays out of flow too.
      '<div id="newsletterFormMsg" class="form-text" style="position:absolute;left:0;top:100%;margin-top:8px;width:100%;"></div>\n</form>'
    );
    return updated;
  });
}

// The space-booking fields in staging aren't wrapped in a <form> at all, and "submit" is
// really just an <a href="response.html"> around the button. Wrap it in a real form so it
// can be validated and posted.
function activateSpaceBookingForm(html) {
  html = html.replace(
    '<div class="space-booking-form-box-main">',
    '<div class="space-booking-form-box-main">\n<form id="spaceBookingForm" novalidate>'
  );
  html = html.replace(
    /<a href="\/response">\s*<input type="submit" name="btnRegistration" value="Submit" id="btnRegistration" class="download-brochure-btn leading-voices-btn">\s*<\/a>/,
    '<div id="spaceBookingFormMsg" class="form-text mb-2"></div>\n' +
      '<input type="submit" name="btnRegistration" value="Submit" id="btnRegistration" class="download-brochure-btn leading-voices-btn">'
  );
  // Close the form right after the mandatory-fields note, before the outer box closes.
  html = html.replace(
    /(Note: <span class="star-mark">\*<\/span> Fields are mandatory<\/div>\s*<\/div>\s*<\/div>)(\s*)/,
    "$1\n</form>$2"
  );
  return html;
}

function extractMeta(head) {
  const title = /<title>([\s\S]*?)<\/title>/.exec(head);
  const description = /<meta\s+name="description"\s+content="([\s\S]*?)">/.exec(head);
  const keywords = /<meta\s+name="keywords"\s+content="([\s\S]*?)">/.exec(head);
  return {
    title: title ? title[1].trim() : "",
    description: description ? description[1] : "",
    keywords: keywords ? keywords[1] : ""
  };
}

function extractScriptsAndStrip(body) {
  // Strip HTML comments first — some vendor <script> tags in staging are wrapped in
  // <!-- --> and were never meant to execute; a naive script regex would still catch them.
  body = body.replace(/<!--[\s\S]*?-->/g, "");

  // Bake the copyright year in statically instead of leaving an inert document.write script.
  const year = new Date().getFullYear();
  body = body.replace(
    /<script[^>]*>\s*var year = new Date\(\);\s*document\.write\(year\.getFullYear\(\)\);\s*<\/script>/g,
    String(year)
  );

  const scripts = [];
  const scriptTagRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  const strippedBody = body.replace(scriptTagRe, (match, attrs, code) => {
    const srcMatch = /src="([^"]+)"/.exec(attrs);
    if (srcMatch) {
      scripts.push({
        type: "src",
        src: resolveAssetPath(srcMatch[1]),
        async: /\basync\b/.test(attrs)
      });
    } else if (code.trim()) {
      scripts.push({ type: "inline", code: code });
    }
    return "";
  });

  return { strippedBody: rewritePaths(strippedBody), scripts };
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const page of PAGES) {
  const raw = fs.readFileSync(path.join(STAGING_DIR, page.file), "utf8");

  const headMatch = /<head>([\s\S]*?)<\/head>/.exec(raw);
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/.exec(raw);
  if (!headMatch || !bodyMatch) {
    throw new Error(`Could not locate <head>/<body> in ${page.file}`);
  }

  const meta = extractMeta(headMatch[1]);
  let { strippedBody, scripts } = extractScriptsAndStrip(bodyMatch[1]);

  const pagesWithNewsletterForm = [
    "default.html",
    "space-booking.html",
    "response.html",
    "response-newsletter.html"
  ];
  const beforeNewsletter = strippedBody;
  strippedBody = activateNewsletterForm(strippedBody);
  if (strippedBody !== beforeNewsletter) {
    console.log(`  activated newsletter form in ${page.file}`);
  } else if (pagesWithNewsletterForm.includes(page.file)) {
    throw new Error(`Expected a newsletter form to activate in ${page.file} but none matched.`);
  }

  if (page.file === "space-booking.html") {
    const beforeSpaceBooking = strippedBody;
    strippedBody = activateSpaceBookingForm(strippedBody);
    if (strippedBody === beforeSpaceBooking) {
      throw new Error(`Failed to activate space-booking form in ${page.file} — markup shape changed?`);
    }
  }

  const outPath = path.join(OUT_DIR, `${page.name}.ts`);
  const contents =
    `// AUTO-GENERATED by scripts/extract-legacy-pages.js from staging/${page.file}. Do not hand-edit.\n` +
    `export const meta = ${JSON.stringify(meta, null, 2)} as const;\n\n` +
    `export const html = ${JSON.stringify(strippedBody)};\n\n` +
    `export const scripts = ${JSON.stringify(scripts, null, 2)} as const;\n`;

  fs.writeFileSync(outPath, contents, "utf8");
  console.log(`Wrote ${outPath} (${scripts.length} scripts)`);
}
