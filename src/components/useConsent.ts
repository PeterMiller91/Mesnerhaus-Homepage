"use client";

import { useSyncExternalStore } from "react";
import { currentConsent, subscribeConsent, type Consent } from "@/lib/consent";

let cache: { raw: string; value: Consent | null } = { raw: "", value: null };
function snapshot(): Consent | null {
  const c = currentConsent();
  const raw = JSON.stringify(c);
  if (raw !== cache.raw) cache = { raw, value: c };
  return cache.value;
}

/* undefined = noch nicht im Browser bekannt (statisches Rendern), null = keine Entscheidung */
export default function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribeConsent, snapshot, () => undefined);
}
