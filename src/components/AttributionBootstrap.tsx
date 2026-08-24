"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Capture ad-source context once when the client application boots. */
export default function AttributionBootstrap() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
