/**
 * Task: Public hero aligned with covuadaisy.com — centered CLB title, tagline, Học Offline / Học Online
 * Code: Light band hero; CMS overrides title/description/media when present
 * Author: DucManh-BlueOC
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import React from "react";
import { usePublicCms } from "../../context/PublicCmsContext";
import { useSystemSettings } from "../../context/SystemSettingsContext";

const defaultHeroImage =
  "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=1200&q=80";

const HeroSection = () => {
  const { cms } = usePublicCms();
  const { settings } = useSystemSettings();
  const hero = cms?.home?.hero || {};
  const centerName = settings?.centerName || "Z Chess";
  const title =
    hero?.title || `CLB Cờ Vua ${centerName}`;
  const description =
    hero?.description || `Học cờ vua cùng ${centerName}.`;
  const offlineHref = hero?.primaryButtonLink || "/contact";
  const onlineHref = hero?.secondaryButtonLink || "/courses";
  const offlineLabel = hero?.primaryButtonText || "Học Offline";
  const onlineLabel = hero?.secondaryButtonText || "Học Online";
  const mediaUrl = hero?.mediaUrl || defaultHeroImage;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground border-b border-slate-200/80 dark:border-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(56,189,248,0.18),transparent)] dark:bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent)]"
      />
      <div className="relative z-[1] container mx-auto px-4 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-[clamp(1.65rem,4vw+0.6rem,2.75rem)] font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
            className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center"
          >
            <Link
              to={offlineHref}
              className="inline-flex justify-center items-center px-8 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {offlineLabel}
            </Link>
            <Link
              to={onlineHref}
              className="inline-flex justify-center items-center px-8 py-3 rounded-full border-2 border-sky-600 text-sky-700 bg-white/90 text-sm font-semibold hover:bg-sky-50 transition-colors dark:bg-transparent dark:text-sky-300 dark:border-sky-500 dark:hover:bg-sky-950/40"
            >
              {onlineLabel}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
          className="mt-10 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/80 dark:ring-white/10"
        >
          {hero?.mediaType === "video" ? (
            <video
              src={mediaUrl}
              className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover bg-black"
              controls
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Hoạt động học và chơi cờ vua"
              className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover"
            />
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
