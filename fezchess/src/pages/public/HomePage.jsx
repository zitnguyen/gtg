import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginLink from "../../components/auth/LoginLink";
import { motion, useInView } from "framer-motion";
import HeroSection from "../../components/sections/HeroSection";
import CoursesSection from "../../components/sections/CoursesSection";
import TestimonialSection from "../../components/sections/TestimonialSection";
import CTASection from "../../components/sections/CTASection";
import PageTransition from "../../components/layout/PageTransition";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Layers,
  MapPin,
  Phone,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { usePublicCms } from "../../context/PublicCmsContext";
import { useTheme } from "../../context/ThemeContext";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import ScrollReveal from "../../components/common/ScrollReveal";

const StatCounter = ({ value, label, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let rafId;
    const start = performance.now();
    const duration = 700;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [inView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeInOut", delay: delay / 1000 }}
      className="px-3 py-2 text-center"
    >
      <div className="text-xl md:text-2xl font-bold text-white leading-none">{count}+</div>
      <div className="mt-1 text-[11px] md:text-xs text-blue-100/90">{label}</div>
    </motion.div>
  );
};

const HomePage = () => {
  const { cms } = usePublicCms();
  const { isDark } = useTheme();
  const { settings } = useSystemSettings();
  const home = cms?.home || {};
  const location = useLocation();
  const centerLabel = settings?.centerName || "Z Chess";

  // Task: Smooth-scroll to in-page anchors (#club-intro, #leaderboard-teaser, …)
  // Author: DucManh-BlueOC
  useEffect(() => {
    const id = location.hash?.replace(/^#/, "");
    if (!id) return undefined;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.hash]);

  return (
    <PageTransition>
      <div
        style={{
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          fontFamily:
            home?.fontFamily && home.fontFamily !== "inherit"
              ? home.fontFamily
              : undefined,
        }}
      >
        <HeroSection />

        {/* Task: Dải giới thiệu ngắn — covuadaisy.com */}
        {/* Author: DucManh-BlueOC */}
        <section className="py-7 md:py-8 bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-white/10">
          <div className="container mx-auto px-4">
            <p className="text-center text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
              Đồng hành cùng bé trên con đường cờ vua.
            </p>
          </div>
        </section>

        {/* Task: Club intro — tiêu đề & 4 trụ cột theo covuadaisy.com */}
        {/* Author: DucManh-BlueOC */}
        <section
          id="club-intro"
          className="scroll-mt-28 md:scroll-mt-32 py-12 md:py-14 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-white/10"
        >
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-7 md:mb-9">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trung tâm cờ vua {centerLabel}
              </p>
              <h2 className="mt-2 text-[28px] md:text-3xl font-bold text-foreground">
                Hành trình tri thức cờ vua
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
                Khóa học được cập nhật thường xuyên; lộ trình phù hợp mọi trình độ;
                cộng đồng học viên gắn kết; thời gian học linh hoạt cho nhịp sinh hoạt
                của bé.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
                <Link
                  to="/contact"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Học Offline
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl border border-border bg-background text-foreground font-semibold text-sm hover:bg-muted/60 transition-colors"
                >
                  Học Online
                </Link>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[
                {
                  icon: <BookOpen size={18} />,
                  title: "Kiến thức",
                  desc: "Nội dung được cập nhật với lý thuyết và ví dụ thực tế mới nhất.",
                },
                {
                  icon: <Layers size={18} />,
                  title: "Trình độ",
                  desc: "Nhiều cấp độ khác nhau, phù hợp từ người mới đến thi đấu.",
                },
                {
                  icon: <Users size={18} />,
                  title: "Cộng đồng",
                  desc: "Kết nối học viên, phụ huynh và giảng viên trong một môi trường tích cực.",
                },
                {
                  icon: <Clock size={18} />,
                  title: "Thời gian",
                  desc: "Lịch học đa dạng — offline & online — phù hợp học sinh bận rộn.",
                },
              ].map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl bg-white dark:bg-zinc-900 border border-[#ececec] dark:border-white/10 p-5 min-h-[168px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-3">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Task: Khối “Tìm hiểu…” + luyện cờ — thứ tự như covuadaisy.com */}
        {/* Author: DucManh-BlueOC */}
        <section className="py-10 md:py-12 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-white/10">
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center max-w-3xl mx-auto mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Tìm hiểu mọi thứ về cờ vua
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Cùng {centerLabel} khám phá thế giới cờ vua qua khóa học online và
                offline — rèn tư duy, kỷ luật và niềm vui trong từng ván cờ.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-10 md:py-12 bg-slate-900 text-white border-t border-slate-800">
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                Luyện cờ trực tuyến — miễn phí
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl mx-auto leading-relaxed">
                Phân tích ván cờ với engine, câu đố mỗi ngày và chế độ giải nhanh
                — trải nghiệm tương tự các nền tảng mở như{" "}
                <a
                  href="https://lichess.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline font-medium"
                >
                  lichess.org
                </a>
                , tích hợp sẵn trên Z Chess.
              </p>
            </ScrollReveal>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mb-8">
              <Link
                to="/training"
                className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Trung tâm câu đố & luyện
              </Link>
              <Link
                to="/play/live"
                className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-emerald-100 font-semibold text-sm hover:bg-emerald-900/50 transition-colors"
              >
                <Swords className="h-4 w-4" />
                Đối kháng online (thành viên)
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  to: "/analysis",
                  title: "Phân tích bàn cờ",
                  desc: "Tải PGN/FEN, xem nước đề xuất, đồ thị đánh giá.",
                  icon: <Cpu className="h-6 w-6" />,
                },
                {
                  to: "/training/daily",
                  title: "Câu đố mỗi ngày",
                  desc: "Một thế cờ mới mỗi ngày để duy trì thói quen.",
                  icon: <Calendar className="h-6 w-6" />,
                },
                {
                  to: "/training/puzzle-rush",
                  title: "Puzzle Rush",
                  desc: "Giải càng nhiều câu càng tốt trong thời gian giới hạn.",
                  icon: <Zap className="h-6 w-6" />,
                },
                {
                  to: "/training/puzzle-survival",
                  title: "Puzzle Survival",
                  desc: "Chuỗi câu đố — một nước sai là dừng.",
                  icon: <Flame className="h-6 w-6" />,
                },
              ].map((item, index) => (
                <ScrollReveal key={item.to} delay={index * 0.06}>
                  <Link
                    to={item.to}
                    className="block h-full rounded-2xl border border-slate-700 bg-slate-800/60 p-5 hover:bg-slate-800 hover:border-sky-500/50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-3">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="leaderboard-teaser"
          className="scroll-mt-28 md:scroll-mt-32 py-12 md:py-14 bg-slate-100 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-white/10"
        >
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Bảng xếp hạng học viên
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Bảng điểm nội bộ và tiến độ theo cấp độ dành cho học viên đã đăng ký.
              Đăng nhập bằng tài khoản để xem trong khu vực dành cho phụ huynh và học
              sinh.
            </p>
            <LoginLink className="inline-flex mt-6 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Đăng nhập để xem
            </LoginLink>
          </div>
        </section>

        <section
          id="venues"
          className="scroll-mt-28 md:scroll-mt-32 py-12 md:py-14 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-white/10"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold text-center text-foreground mb-8">
              Liên hệ & địa chỉ
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  Địa chỉ
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {settings?.address ||
                    "1181/26 KDC Lê Văn Lương, xã Nhà Bè, TP. Hồ Chí Minh"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  Điện thoại
                </h3>
                <p className="text-sm text-muted-foreground">
                  {settings?.hotline || "0934 830 045"}
                </p>
                <Link
                  to="/contact"
                  className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Gửi tin nhắn / đặt lịch tư vấn
                </Link>
              </div>
            </div>
          </div>
        </section>

        <CoursesSection />
        <section className="py-12 md:py-14 bg-black text-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-10 items-center">
              <ScrollReveal>
                <div>
                  <h2 className="text-[28px] md:text-3xl font-bold mb-4">
                    Tại sao nên chọn {centerLabel}?
                  </h2>
                  <div className="space-y-4">
                    {[
                      "Phương pháp học trực quan, dễ hiểu và tạo hứng thú cho trẻ.",
                      "Chương trình theo cấp độ, đo lường tiến bộ rõ ràng sau từng giai đoạn.",
                      "Kết hợp kỹ năng cờ vua với tư duy học tập và kỷ luật cá nhân.",
                    ].map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.35, delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 size={14} />
                        </span>
                        <p className="text-white/85 text-sm leading-relaxed">
                          {item}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.12}>
                <div className="grid grid-cols-2 gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=500&q=80"
                    alt="chess-kids"
                    className="rounded-xl object-cover w-full h-36 md:h-44"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=500&q=80"
                    alt="chess-coach"
                    className="rounded-xl object-cover w-full h-36 md:h-44"
                  />
                  <div className="rounded-xl bg-blue-600/12 border border-blue-500/30 text-blue-100 p-4 col-span-2 text-center">
                    <div className="text-sm md:text-base font-semibold text-white">
                      Môi trường học tập truyền cảm hứng cho từng bước tiến bộ.
                    </div>
                    <div className="text-xs text-white/80 mt-1.5">
                      Tập trung vào tư duy chiến thuật, kỷ luật và bản lĩnh thi
                      đấu.
                    </div>
                    <div className="mt-4 grid grid-cols-3 divide-x divide-blue-200/30 rounded-lg bg-black/20">
                      <StatCounter value={40} label="Học viên" delay={0} />
                      <StatCounter value={4} label="Năm kinh nghiệm" delay={80} />
                      <StatCounter value={30} label="Giải thưởng" delay={160} />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
        <TestimonialSection />
        <CTASection />
      </div>
    </PageTransition>
  );
};

export default HomePage;
