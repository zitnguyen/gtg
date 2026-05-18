/**
 * Task: Social-proof toast — dữ liệu từ khóa học đã xuất bản + bật/tắt System settings
 * Nội dung: Gọi API /courses (published), không dùng mock tên/người; chỉ hiện khi có khóa học
 * Tác giả: DucManh-BlueOC
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  X,
  Briefcase,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import courseService from "../../services/courseService";

const DISPLAY_MS = 8500;
const GAP_BETWEEN_MS = 4000;
const COOLDOWN_AFTER_CLOSE_MS = 45000;

const AVATAR_HUES = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
];

const LEVEL_VI = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  "All Levels": "Mọi cấp",
};

const CATEGORY_VI = {
  Opening: "Khai cuộc",
  Strategy: "Chiến lược",
  Tactics: "Chiến thuật",
  Endgame: "Tàn cuộc",
  General: "Tổng hợp",
};

function formatVnd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
}

function pickDisplayPrice(course) {
  const price = Number(course?.price) || 0;
  const sale = Number(course?.salePrice) || 0;
  if (sale > 0 && sale < price) return { amount: sale, isSale: true };
  return { amount: price, isSale: false };
}

function titleInitial(title) {
  const t = String(title || "").trim();
  if (!t) return "K";
  return t.charAt(0).toUpperCase();
}

function avatarClass(seed) {
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * 13) % 997;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}

function mapCoursesToItems(courses) {
  const list = Array.isArray(courses) ? courses : [];
  return list.map((c) => {
    const { amount, isSale } = pickDisplayPrice(c);
    const enrolled = Number(c.enrolledStudents) || 0;
    const lessons = Number(c.totalLessons) || 0;
    const level = LEVEL_VI[c.level] || c.level || "";
    const cat = CATEGORY_VI[c.category] || c.category || "";
    const metaBits = [level, cat].filter(Boolean);
    return {
      id: String(c._id),
      slug: c.slug,
      initial: titleInitial(c.title),
      displayName: "Đăng ký khóa học",
      product: c.title,
      priceText: formatVnd(amount),
      priceHint: isSale ? "Giá ưu đãi" : "Học phí",
      enrolledLine:
        enrolled > 0
          ? `${enrolled.toLocaleString("vi-VN")} học viên đã tham gia`
          : "Đang mở đăng ký",
      footerLine:
        metaBits.length > 0
          ? `${metaBits.join(" · ")}${lessons > 0 ? ` · ${lessons} bài` : ""}`
          : lessons > 0
            ? `${lessons} bài học`
            : "Khóa học trên hệ thống",
    };
  });
}

const SocialProofPurchaseToast = () => {
  const { settings } = useSystemSettings();
  const enabled = !!settings?.social_proof_toast_enabled;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [items, setItems] = useState([]);
  const [coursesReady, setCoursesReady] = useState(false);
  const cooldownUntil = useRef(0);
  const gapTimer = useRef(null);
  const displayTimer = useRef(null);

  const item = useMemo(
    () => items[index % Math.max(items.length, 1)] || null,
    [items, index],
  );

  const scheduleNext = useCallback(() => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    gapTimer.current = setTimeout(() => {
      if (!enabledRef.current) return;
      if (!items.length) return;
      setIndex((i) => (i + 1) % items.length);
      setProgressKey((k) => k + 1);
      setOpen(true);
    }, GAP_BETWEEN_MS);
  }, [items.length]);

  const handleClose = useCallback(() => {
    setOpen(false);
    cooldownUntil.current = Date.now() + COOLDOWN_AFTER_CLOSE_MS;
    if (displayTimer.current) {
      clearTimeout(displayTimer.current);
      displayTimer.current = null;
    }
    if (gapTimer.current) clearTimeout(gapTimer.current);
    gapTimer.current = setTimeout(() => {
      if (!enabledRef.current || !items.length) return;
      setIndex((i) => (i + 1) % items.length);
      setProgressKey((k) => k + 1);
      setOpen(true);
    }, COOLDOWN_AFTER_CLOSE_MS);
  }, [items.length]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setCoursesReady(false);
      setOpen(false);
      if (gapTimer.current) {
        clearTimeout(gapTimer.current);
        gapTimer.current = null;
      }
      if (displayTimer.current) {
        clearTimeout(displayTimer.current);
        displayTimer.current = null;
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await courseService.getPublishedCourses({ limit: 40 });
        const raw = Array.isArray(res) ? res : res?.data ?? [];
        const mapped = mapCoursesToItems(Array.isArray(raw) ? raw : []);
        if (!cancelled) {
          setItems(mapped);
          setIndex(0);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setCoursesReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      if (gapTimer.current) {
        clearTimeout(gapTimer.current);
        gapTimer.current = null;
      }
      if (displayTimer.current) {
        clearTimeout(displayTimer.current);
        displayTimer.current = null;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !coursesReady || !items.length) return undefined;
    const t = setTimeout(() => {
      if (!enabledRef.current) return;
      if (Date.now() < cooldownUntil.current) return;
      setOpen(true);
    }, 2200);
    return () => clearTimeout(t);
  }, [enabled, coursesReady, items.length]);

  useEffect(() => {
    if (!enabled || !coursesReady || !items.length || !open || reduceMotion)
      return undefined;
    if (displayTimer.current) clearTimeout(displayTimer.current);
    displayTimer.current = setTimeout(() => {
      setOpen(false);
      scheduleNext();
    }, DISPLAY_MS);
    return () => {
      if (displayTimer.current) clearTimeout(displayTimer.current);
    };
  }, [
    enabled,
    coursesReady,
    items.length,
    open,
    item?.id,
    progressKey,
    reduceMotion,
    scheduleNext,
  ]);

  useEffect(
    () => () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
      if (displayTimer.current) clearTimeout(displayTimer.current);
    },
    [],
  );

  const durationSec = reduceMotion ? 0.01 : DISPLAY_MS / 1000;

  if (!enabled || !coursesReady || !items.length || !item) return null;

  const courseHref = item.slug ? `/courses/${item.slug}` : "/courses";

  return (
    <div
      className="pointer-events-none fixed z-[90] w-[min(100%,22rem)] sm:w-[22rem]"
      style={{
        left: "max(1rem, env(safe-area-inset-left, 0px))",
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={`${item.id}-${progressKey}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/5"
          >
            <div className="relative h-[3px] w-full overflow-hidden bg-emerald-950/80">
              <motion.div
                key={progressKey}
                className="absolute inset-y-0 right-0 w-full origin-right bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                initial={{ scaleX: reduceMotion ? 0 : 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: durationSec, ease: "linear" }}
              />
            </div>

            <div className="p-4 pt-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/40 shadow-[0_0_14px_rgba(16,185,129,0.25)]">
                    <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                    Vừa mua
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                      aria-hidden
                    />
                    Khóa học hiện có
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${avatarClass(item.id + item.product)}`}
                  >
                    {item.initial}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#111827] ring-2 ring-[#111827]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-semibold text-white">
                    {item.displayName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <Briefcase className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                    vừa mua thành công
                  </p>
                </div>
              </div>

              <Link
                to={courseHref}
                className="mt-3 block rounded-xl bg-black/35 px-3 py-2.5 ring-1 ring-white/5 hover:bg-black/45 transition-colors text-left"
              >
                <p className="text-[12px] font-semibold leading-snug text-white line-clamp-2">
                  {item.product}
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-bold text-emerald-400">
                    {item.priceText}
                  </span>
                  <span className="text-[11px] text-slate-500">{item.priceHint}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{item.enrolledLine}</p>
              </Link>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
                {item.footerLine}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialProofPurchaseToast;
