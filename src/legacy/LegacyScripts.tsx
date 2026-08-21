"use client";

import { useEffect, useRef } from "react";
import { runLegacyScripts, type LegacyScript } from "./runLegacyScripts";

export default function LegacyScripts({ scripts }: { scripts: readonly LegacyScript[] }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runLegacyScripts(scripts);
  }, [scripts]);

  return null;
}
