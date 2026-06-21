import { useState, useRef, useEffect } from "react";
import { useLang, LANG_OPTIONS } from "@/lib/i18n";
import { ChevronDown } from "lucide-react";

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = LANG_OPTIONS.find((o) => o.value === lang)?.label || "KOR";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 bg-card/80 backdrop-blur border border-border rounded-full text-xs font-medium text-primary transition-all hover:border-primary"
      >
        🌐 {currentLabel}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-card/95 backdrop-blur border border-border rounded-xl overflow-hidden shadow-lg z-50 min-w-[80px]">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setLang(opt.value); setOpen(false); }}
              className={`w-full px-4 py-2 text-xs font-medium transition-colors text-center ${
                opt.value === lang
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
