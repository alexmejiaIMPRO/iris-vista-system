import {
  Search,
  Bell,
  Globe,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

type PageType = 'home' | 'catalog' | 'cart' | 'punchout' | 'equipment' | 'service' | 'contract' | 'production' | 'inventory' | 'supplier' | 'analytics' | 'admin' | 'masterdata' | 'prpo' | 'approvals';

interface HeaderProps {
  language: "en" | "zh" | "es";
  setLanguage: (lang: "en" | "zh" | "es") => void;
  cartItemCount: number;
  navigateTo: (page: PageType) => void;
}

export function Header({
  language,
  setLanguage,
  cartItemCount,
  navigateTo,
}: HeaderProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const text = {
    en: {
      search: "Search IRIS Vista...",
      notifications: "Notifications",
      languages: {
        en: "English",
        zh: "中文",
        es: "Español",
      },
    },
    zh: {
      search: "搜索 IRIS Vista...",
      notifications: "通知",
      languages: {
        en: "English",
        zh: "中文",
        es: "Español",
      },
    },
    es: {
      search: "Buscar IRIS Vista...",
      notifications: "Notificaciones",
      languages: {
        en: "English",
        zh: "中文",
        es: "Español",
      },
    },
  };

  const t = text[language];

  const languageLabels = {
    en: "EN",
    zh: "中文",
    es: "ES",
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E4E1DD] shadow-sm">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-100"
        >
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#75534B] to-[#5D423C] shadow-md transition-shadow duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            <span
              className="relative text-xl text-white"
              style={{
                fontFamily:
                  "system-ui, -apple-system, sans-serif",
                fontWeight: 700,
              }}
            >
              IRIS
            </span>
          </div>
          <div className="text-left">
            <div
              className="text-xl text-[#2C2C2C]"
              style={{
                fontFamily:
                  "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              VISTA
            </div>
            <div
              className="text-xs text-[#75534B]"
              style={{
                fontFamily:
                  "system-ui, -apple-system, sans-serif",
                fontWeight: 400,
              }}
            >
              Supply Chain & Procurement
            </div>
          </div>
        </button>

        {/* Global Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full rounded-xl border border-[#E4E1DD] bg-[#F9F8F6] py-2.5 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <button
            onClick={() => navigateTo('cart')}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#75534B] transition-all duration-200 hover:bg-[#F9F8F6] active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#E08A4B] to-[#E08A4B]/80 text-xs text-white shadow-md">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#75534B] transition-all duration-200 hover:bg-[#F9F8F6] active:scale-95">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#D1625B]"></span>
          </button>

          {/* Language Switch */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 rounded-xl border border-[#E4E1DD] px-3 py-2 text-sm text-[#75534B] transition-all duration-200 hover:border-[#75534B] hover:bg-[#F9F8F6] active:scale-95"
            >
              <Globe className="h-4 w-4" />
              <span
                style={{
                  fontFamily:
                    "system-ui, -apple-system, sans-serif",
                  fontWeight: 500,
                }}
              >
                {languageLabels[language]}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Language Dropdown */}
            {showLangMenu && (
              <div className="absolute right-0 top-12 w-48 rounded-xl bg-white shadow-lg border border-[#E4E1DD] overflow-hidden z-50">
                {Object.entries(t.languages).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setLanguage(key as "en" | "zh" | "es");
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      language === key
                        ? "bg-[#75534B]/10 text-[#75534B]"
                        : "text-[#2C2C2C] hover:bg-[#F9F8F6]"
                    }`}
                    style={{
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontWeight: language === key ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#75534B] to-[#5D423C] text-sm text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95">
            <span
              style={{
                fontFamily:
                  "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
              }}
            >
              AS
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}