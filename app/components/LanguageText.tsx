"use client";

import { useLanguage } from "../lib/useLanguage";

export default function LanguageText({
  id,
  fallback,
}: {
  id: string;
  fallback?: string;
}) {
  const { t } = useLanguage();
  return <>{(t as Record<string, string>)[id] || fallback || ""}</>;
}
