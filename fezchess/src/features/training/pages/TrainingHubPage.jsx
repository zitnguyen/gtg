/**
 * Task: Trung tâm câu đố & luyện — điểm vào quan trọng nhất (daily, rush, survival, đối kháng)
 * Tác giả: DucManh-BlueOC
 */
import { Link } from "react-router-dom";
import { Calendar, Flame, Swords, Zap, Target } from "lucide-react";
import ScrollReveal from "../../../components/common/ScrollReveal";
import authService from "../../../services/authService";

const cards = [
  {
    to: "/training/daily",
    title: "Câu đố mỗi ngày",
    desc: "Một thế cờ mới mỗi ngày — duy trì thói quen tính toán.",
    icon: Calendar,
    accent: "from-amber-500/20 to-orange-600/10 border-amber-500/30",
  },
  {
    to: "/training/puzzle-rush",
    title: "Puzzle Rush",
    desc: "Giải liên tiếp trong giới hạn thời gian.",
    icon: Zap,
    accent: "from-sky-500/20 to-blue-600/10 border-sky-500/30",
  },
  {
    to: "/training/puzzle-survival",
    title: "Puzzle Survival",
    desc: "Chuỗi câu đố — sai một nước là dừng.",
    icon: Flame,
    accent: "from-rose-500/20 to-red-600/10 border-rose-500/30",
  },
  {
    to: "/play/live",
    title: "Đối kháng với thành viên",
    desc: "Tạo phòng mã 6 ký tự, gửi link cho bạn — chơi realtime.",
    icon: Swords,
    accent: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30",
  },
];

const TrainingHubPage = () => {
  const user = authService.getCurrentUser();
  const role = String(user?.role || "").toLowerCase();
  const myElo = Number.isFinite(user?.elo) ? user.elo : 100;

  const assignmentPath =
    role === "student"
      ? "/student/daily-exercises"
      : role === "parent"
        ? "/parent/daily-exercises"
        : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10 md:pt-14">
        <ScrollReveal>
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-xl bg-sky-500/20 p-3 text-sky-300">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Câu đố & luyện cờ
              </h1>
              <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                Tập trung cải thiện chiến thuật và phản xạ. Đối kháng online dành
                cho tài khoản đã đăng nhập — tạo phòng và chia sẻ mã với bạn bè
                trong trung tâm.
              </p>
              {user ? (
                <p className="mt-3 text-sm text-sky-300/95">
                  Elo của bạn:{" "}
                  <strong className="font-mono text-white">{myElo}</strong> (sàn
                  100 — cập nhật sau ván đối kháng)
                </p>
              ) : null}
            </div>
          </div>
        </ScrollReveal>

        {assignmentPath ? (
          <ScrollReveal className="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm">
            <span className="text-slate-400">Bài tập từ giáo viên: </span>
            <Link
              to={assignmentPath}
              className="text-sky-400 font-semibold hover:underline"
            >
              {role === "student" ? "Câu đố hôm nay" : "Câu đố giao cho con"}
            </Link>
          </ScrollReveal>
        ) : null}

        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          {cards.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.to} delay={i * 0.05}>
                <Link
                  to={item.to}
                  className={`block h-full rounded-2xl border bg-gradient-to-br p-6 hover:opacity-95 transition-opacity ${item.accent}`}
                >
                  <Icon className="h-8 w-8 text-sky-300 mb-3" />
                  <h2 className="text-xl font-bold text-white mb-2">{item.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal className="mt-10 text-center text-xs text-slate-500">
          <Link to="/analysis" className="text-sky-500/90 hover:underline">
            Phân tích bàn cờ (Stockfish)
          </Link>
          <span className="mx-2">·</span>
          <Link to="/courses" className="text-sky-500/90 hover:underline">
            Khóa học có bài cờ
          </Link>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default TrainingHubPage;
