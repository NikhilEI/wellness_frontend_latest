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

// exhibitor-profile.html is a distinct legacy template (different header/footer, different
// org, broken nav links) left over from another site — it doesn't share header/footer markup
// with the other four pages, so it stays a single self-contained page export.
const STANDARD_PAGES = new Set([
  "default.html",
  "space-booking.html",
  "response.html",
  "response-newsletter.html"
]);

const HEADER_RE = /<header class="fixed-top-band">[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer>[\s\S]*?<\/footer>/;

// Emits a template literal instead of JSON.stringify so the generated .ts files keep the
// original multi-line HTML formatting (readable in an editor) instead of one giant escaped line.
function toTemplateLiteral(html) {
  const escaped = html.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return "`" + escaped + "`";
}

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

  // type="number" silently ignores maxlength/minlength in every browser, so the original
  // "6-20 digits" constraint was never actually enforced. tel + inputmode="numeric" keeps
  // the numeric keypad on mobile while making length limits (10 digits) real.
  const beforeMobile = html;
  html = html.replace(
    'name="Mobile_No" type="number" class="form-control" id="Mobile_No" data-field="Mobile_No" placeholder="" required="required" autocomplete="off" data-validate="Mobile_No" maxlength="20" minlength="6" data-msg-required="Please enter your mobile no."',
    'name="Mobile_No" type="tel" inputmode="numeric" pattern="[0-9]{10}" class="form-control" id="Mobile_No" data-field="Mobile_No" placeholder="" required="required" autocomplete="off" data-validate="Mobile_No" maxlength="10" minlength="10" data-msg-required="Please enter your mobile no." data-msg-pattern="Please enter a valid 10-digit mobile number"'
  );
  if (html === beforeMobile) {
    throw new Error("Failed to upgrade Mobile_No field to type=tel — markup shape changed?");
  }

  // Staging's captcha markup is a frozen, non-functional DOM snapshot (a captured
  // rendered iframe, not a live widget). Swap it for an empty container that
  // RecaptchaWidget.tsx renders a real widget into once a site key is configured.
  const beforeRecaptcha = html;
  html = html.replace(
    /<div id="g-recaptcha" class="g-recaptcha"[\s\S]*?<\/div>(?=\s*<label id="g-recaptcha-error")/,
    '<div id="g-recaptcha-container"></div>'
  );
  if (html === beforeRecaptcha) {
    throw new Error("Failed to replace the frozen g-recaptcha markup — markup shape changed?");
  }

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

let sharedHeaderHtml = null;
let sharedFooterHtml = null;

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

  let pageHtml = strippedBody;

  if (STANDARD_PAGES.has(page.file)) {
    const headerMatch = HEADER_RE.exec(strippedBody);
    const footerMatch = FOOTER_RE.exec(strippedBody);
    if (!headerMatch || !footerMatch) {
      throw new Error(`Could not locate shared header/footer markup in ${page.file} — layout changed?`);
    }
    const thisHeader = headerMatch[0];
    const thisFooter = footerMatch[0];

    if (sharedHeaderHtml === null) {
      sharedHeaderHtml = thisHeader;
    } else if (thisHeader !== sharedHeaderHtml) {
      throw new Error(
        `Header markup in ${page.file} no longer matches the shared header extracted from an earlier page — ` +
          `the pages have diverged, so the header/footer split in this script needs updating.`
      );
    }

    if (sharedFooterHtml === null) {
      sharedFooterHtml = thisFooter;
    } else if (thisFooter !== sharedFooterHtml) {
      throw new Error(
        `Footer markup in ${page.file} no longer matches the shared footer extracted from an earlier page — ` +
          `the pages have diverged, so the header/footer split in this script needs updating.`
      );
    }

    // Page-specific content is whatever surrounds the shared header/footer (there can be
    // trailing markup after </footer>, e.g. default.html's mobile "Book Your Space" button).
    pageHtml =
      strippedBody.slice(0, headerMatch.index) +
      strippedBody.slice(headerMatch.index + thisHeader.length, footerMatch.index) +
      strippedBody.slice(footerMatch.index + thisFooter.length);
  }

  const outPath = path.join(OUT_DIR, `${page.name}.ts`);
  const contents =
    `// AUTO-GENERATED by scripts/extract-legacy-pages.js from staging/${page.file}. Do not hand-edit.\n` +
    (STANDARD_PAGES.has(page.file)
      ? `// This is page-specific content only — header.ts and footer.ts hold the markup shared across pages.\n`
      : "") +
    `export const meta = ${JSON.stringify(meta, null, 2)} as const;\n\n` +
    `export const html = ${toTemplateLiteral(pageHtml)};\n\n` +
    `export const scripts = ${JSON.stringify(scripts, null, 2)} as const;\n`;

  fs.writeFileSync(outPath, contents, "utf8");
  console.log(`Wrote ${outPath} (${scripts.length} scripts)`);
}

if (sharedHeaderHtml !== null && sharedFooterHtml !== null) {
  const sharedPagesList = [...STANDARD_PAGES].join(", ");

  const headerPath = path.join(OUT_DIR, "header.ts");
  fs.writeFileSync(
    headerPath,
    `// AUTO-GENERATED by scripts/extract-legacy-pages.js — <header> markup shared by ${sharedPagesList}. Do not hand-edit.\n` +
      `export const html = ${toTemplateLiteral(sharedHeaderHtml)};\n`,
    "utf8"
  );
  console.log(`Wrote ${headerPath}`);

  const footerPath = path.join(OUT_DIR, "footer.ts");
  fs.writeFileSync(
    footerPath,
    `// AUTO-GENERATED by scripts/extract-legacy-pages.js — <footer> markup shared by ${sharedPagesList}. Do not hand-edit.\n` +
      `export const html = ${toTemplateLiteral(sharedFooterHtml)};\n`,
    "utf8"
  );
  console.log(`Wrote ${footerPath}`);
}
