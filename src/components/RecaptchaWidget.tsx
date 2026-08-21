"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
const SCRIPT_ID = "recaptcha-api-script";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: string | HTMLElement,
        params: { sitekey: string }
      ) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    __recaptchaWidgetId?: number;
    __onRecaptchaApiLoad?: () => void;
  }
}

function loadRecaptchaScript(onLoad: () => void) {
  if (document.getElementById(SCRIPT_ID)) {
    // Script tag already present (e.g. from a previous mount) — if the API is ready, use it;
    // otherwise the pending onload/callback below will still fire onLoad once it is.
    if (window.grecaptcha) {
      onLoad();
    }
    return;
  }

  window.__onRecaptchaApiLoad = onLoad;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaApiLoad&render=explicit";
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}

export default function RecaptchaWidget() {
  const hasRendered = useRef(false);

  useEffect(() => {
    if (!SITE_KEY) {
      // Not configured yet — leave the container empty and don't block form submission
      // (SiteForms.tsx only requires a captcha response when a widget actually rendered).
      return;
    }
    if (hasRendered.current) return;

    loadRecaptchaScript(() => {
      if (hasRendered.current) return;
      const container = document.getElementById("g-recaptcha-container");
      if (!container || !window.grecaptcha) return;
      window.__recaptchaWidgetId = window.grecaptcha.render(container, { sitekey: SITE_KEY });
      hasRendered.current = true;
    });
  }, []);

  return null;
}
