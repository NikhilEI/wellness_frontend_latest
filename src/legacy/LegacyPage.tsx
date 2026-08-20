"use client";

import { useEffect, useRef } from "react";

export type LegacyScript =
  | { type: "src"; src: string; async: boolean }
  | { type: "inline"; code: string };

function loadSrcScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    // A missing/broken vendor script shouldn't block the rest of the page.
    el.onerror = () => resolve();
    document.body.appendChild(el);
  });
}

function runInlineScript(code: string) {
  const el = document.createElement("script");
  el.textContent = code;
  document.body.appendChild(el);
}

async function runLegacyScripts(scripts: readonly LegacyScript[]) {
  const pending: Promise<void>[] = [];

  for (const script of scripts) {
    if (script.type === "src") {
      const load = loadSrcScript(script.src);
      if (script.async) {
        pending.push(load);
      } else {
        await load;
      }
    } else {
      runInlineScript(script.code);
    }
  }

  await Promise.all(pending);

  // By the time this effect runs, the browser's real DOMContentLoaded/load events have
  // long since fired, so any handler the legacy scripts registered via addEventListener
  // would otherwise never run. Re-dispatch synthetic events so that wiring still fires.
  document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
  window.dispatchEvent(new Event("load"));
}

export default function LegacyPage({
  html,
  scripts
}: {
  html: string;
  scripts: readonly LegacyScript[];
}) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runLegacyScripts(scripts);
  }, [scripts]);

  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}
