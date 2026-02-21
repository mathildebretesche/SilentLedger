"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  const toggle = () => {
    const langs: Array<"en" | "fr" | "hi"> = ["en", "fr", "hi"];
    const currentIndex = langs.indexOf(lang);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    setLang(nextLang);
  };

  const getLanguageLabel = () => {
    switch (lang) {
      case "en":
        return { flag: "🇬🇧", text: "EN", title: "Switch to French" };
      case "fr":
        return { flag: "🇫🇷", text: "FR", title: "Passer en hindi" };
      case "hi":
        return { flag: "🇮🇳", text: "HI", title: "Switch to English" };
    }
  };

  const label = getLanguageLabel();

  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-white/30 hover:border-white/60 transition-all text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent active:scale-95"
      title={label.title}
    >
      <span className="text-base leading-none">{label.flag}</span>
      <span>{label.text}</span>
    </button>
  );
}
