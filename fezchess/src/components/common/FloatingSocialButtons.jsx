import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronUp, Phone } from "lucide-react";

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/zchessvn",
  zalo: "https://zalo.me/0934830045",
  phone: "tel:0934830045",
};

const buttonBaseClass =
  "h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform duration-300 hover:scale-105 active:scale-95";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.022 10.125 11.927v-8.438H7.078v-3.49h3.047V9.413c0-3.022 1.792-4.69 4.533-4.69 1.313 0 2.686.235 2.686.235v2.968h-1.514c-1.49 0-1.955.931-1.955 1.886v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.095 24 18.099 24 12.073z" />
  </svg>
);

const ZaloIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="#fff" />
    <path
      d="M18 23h28v5L28 42h18v5H18v-5l18-14H18z"
      fill="#0B7BEA"
    />
    <rect x="41.5" y="23" width="4.5" height="24" rx="2.2" fill="#0B7BEA" />
  </svg>
);

const SocialButton = ({ href, label, className, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={`group relative ${buttonBaseClass} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
};

const FloatingSocialButtons = () => {
  const { pathname } = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 260);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/learning/")) {
    return null;
  }

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialButtonClass =
    "overflow-hidden ring-1 ring-white/30 before:absolute before:inset-0 before:rounded-full before:animate-pulse before:bg-white/20 before:content-['']";

  return (
    <div
      className="fixed z-[1200] flex flex-col gap-2.5 sm:gap-3"
      style={{
        right: "max(0.75rem, env(safe-area-inset-right, 0px))",
        bottom:
          "max(5.5rem, calc(5.5rem + env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {showBackToTop ? (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label="Lên đầu trang"
          title="Lên đầu trang"
          className="h-12 w-12 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-bounce"
        >
          <ChevronUp size={22} />
        </button>
      ) : null}

      <SocialButton
        href={SOCIAL_LINKS.facebook}
        label="Facebook"
        className={`${socialButtonClass} bg-[#1877F2]`}
      >
        <FacebookIcon />
      </SocialButton>

      <SocialButton
        href={SOCIAL_LINKS.zalo}
        label="Zalo"
        className={`${socialButtonClass} bg-[#0099E5]`}
      >
        <ZaloIcon />
      </SocialButton>

      <SocialButton
        href={SOCIAL_LINKS.phone}
        label="Gọi ngay: 0934830045"
        className={`${socialButtonClass} bg-gradient-to-br from-[#22C55E] to-[#16A34A]`}
      >
        <Phone className="h-5 w-5" />
      </SocialButton>
    </div>
  );
};

export default FloatingSocialButtons;
