/**
 * Task: Checkout 3 bước + CK như mẫu shop (stepper, QR, nội dung CK, kiểm tra thủ công/poll)
 * Nội dung: Bước 1 đơn hàng → Bước 2 CK + transferMemo từ API → Bước 3 hoàn tất
 * Tác giả: DucManh-BlueOC
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoginLink from "../../components/auth/LoginLink";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import courseService from "../../services/courseService";
import orderService from "../../services/orderService";
import { useSystemSettings } from "../../context/SystemSettingsContext";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function payAmounts(course) {
  if (!course) return { pay: 0, list: 0, hasSale: false, isFree: true };
  const list = Number(course.price) || 0;
  const sale = Number(course.salePrice) || 0;
  const hasSale = sale > 0 && sale < list;
  const pay = hasSale ? sale : list;
  return {
    pay,
    list,
    hasSale,
    isFree: pay === 0,
  };
}

function formatVnd(n) {
  if (!Number.isFinite(n) || n < 0) return "0 đ";
  return `${n.toLocaleString("vi-VN")} đ`;
}

const STEPS = [
  { num: 1, label: "Thông tin đơn hàng" },
  { num: 2, label: "Thanh toán" },
  { num: 3, label: "Hoàn tất" },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-0">
        {STEPS.map((s, idx) => {
          const done = currentStep > s.num;
          const active = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:min-w-[7rem]">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : active
                        ? "border-amber-400 bg-amber-400/20 text-amber-200"
                        : "border-white/20 bg-white/5 text-slate-500"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" strokeWidth={3} /> : s.num}
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      active ? "text-amber-200" : "text-slate-500"
                    }`}
                  >
                    Bước {s.num}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      active || done ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 ? (
                <div
                  className={`hidden sm:block h-0.5 w-8 md:w-14 mx-1 rounded ${
                    currentStep > s.num ? "bg-emerald-500/80" : "bg-white/10"
                  }`}
                  aria-hidden
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const CourseCheckoutPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSystemSettings();
  const [user, setUser] = useState(() => readUser());
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [preparingOrder, setPreparingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [doneOrder, setDoneOrder] = useState(null);
  const pollRef = useRef(null);

  const amounts = useMemo(() => payAmounts(course), [course]);

  const bankBlock = useMemo(
    () => ({
      bankName: settings?.bankName || "—",
      accountNumber: settings?.bankAccountNumber || "—",
      accountName: settings?.bankAccountName || "—",
      qrUrl: settings?.paymentQrUrl || "",
    }),
    [settings],
  );

  const transferMemo = pendingOrder?.transferMemo || "";

  useEffect(() => {
    const onStorage = () => setUser(readUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      try {
        const res = await courseService.getCourseBySlug(slug);
        if (cancelled) return;
        const c = res?.course;
        setCourse(c || null);
        if (res?.canViewContent && c) {
          const first = res.curriculum?.[0]?.lessons?.[0]?._id;
          if (first) {
            navigate(`/learning/${slug}/${first}`, { replace: true });
            return;
          }
          navigate(`/courses/${slug}`, { replace: true });
        }
      } catch {
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  const finalizeSuccessOrder = useCallback(
    async (order) => {
      let firstLessonId = null;
      try {
        const refreshed = await courseService.getCourseBySlug(slug);
        const ch = refreshed?.curriculum?.[0];
        firstLessonId = ch?.lessons?.[0]?._id || null;
      } catch {
        firstLessonId = null;
      }
      setDoneOrder({ order, firstLessonId });
      setPendingOrder(null);
      setStep(3);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    },
    [slug],
  );

  /** Khôi phục đơn pending khi F5 — Author: DucManh-BlueOC */
  useEffect(() => {
    if (!course?._id || !user || loading || doneOrder) return;
    let cancelled = false;
    (async () => {
      try {
        const orders = await orderService.getMyOrders();
        if (cancelled) return;
        const cid = String(course._id);
        const pend = (orders || []).find(
          (o) =>
            o.status === "pending" &&
            (o.items || []).some((it) => {
              const id = it.courseId?._id || it.courseId;
              return String(id) === cid;
            }),
        );
        if (pend?._id) {
          const fresh = await orderService.getById(pend._id);
          if (!cancelled && fresh?.status === "pending") {
            setPendingOrder(fresh);
            setStep(2);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [course?._id, user, loading, doneOrder]);

  /** Poll 8s khi đang chờ CK — Author: DucManh-BlueOC */
  useEffect(() => {
    if (step !== 2 || !pendingOrder?._id || pendingOrder.status !== "pending") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return undefined;
    }
    const tick = async () => {
      try {
        const o = await orderService.getById(pendingOrder._id);
        if (o.status === "completed") {
          toast.success("Đã ghi nhận thanh toán.");
          await finalizeSuccessOrder(o);
        }
      } catch {
        /* ignore */
      }
    };
    pollRef.current = window.setInterval(tick, 8000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [step, pendingOrder?._id, pendingOrder?.status, finalizeSuccessOrder]);

  const copyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast.success("Đã sao chép.");
    } catch {
      toast.error("Không thể sao chép.");
    }
  }, []);

  const goToPaymentStep = async () => {
    if (!course?._id || amounts.isFree) return;
    if (pendingOrder?.status === "pending") {
      setStep(2);
      return;
    }
    try {
      setPreparingOrder(true);
      const o = await orderService.create({
        items: [{ courseId: course._id }],
        paymentMethod: "bank_transfer",
      });
      if (o.status === "completed") {
        toast.info("Bạn đã sở hữu khóa học này.");
        await finalizeSuccessOrder(o);
        return;
      }
      setPendingOrder(o);
      setStep(2);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message;
      toast.error(msg || "Không tạo được đơn hàng.");
    } finally {
      setPreparingOrder(false);
    }
  };

  const checkPaymentManual = async () => {
    if (!pendingOrder?._id) return;
    try {
      setCheckingPayment(true);
      const o = await orderService.getById(pendingOrder._id);
      if (o.status === "completed") {
        toast.success("Thanh toán đã được ghi nhận.");
        await finalizeSuccessOrder(o);
      } else {
        toast.message("Chưa thấy thanh toán hoàn tất", {
          description:
            "Nếu bạn đã chuyển khoản đúng số tiền và nội dung, hãy bấm «Đã hoàn tất chuyển khoản» bên dưới để hệ thống mở khóa ngay; hoặc chờ Admin đối soát.",
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không kiểm tra được. Thử lại sau.",
      );
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCompleteTransfer = async () => {
    if (!course?._id || amounts.isFree) return;
    try {
      setSubmitting(true);
      const order = await orderService.create({
        items: [{ courseId: course._id }],
        paymentMethod: "bank_transfer",
        customerConfirmedBankTransfer: true,
      });
      await finalizeSuccessOrder(order);
      toast.success("Đã mở khóa học — kiểm tra email (nếu đã cấu hình SMTP).");
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message;
      toast.error(msg || "Không thể hoàn tất. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-slate-950 text-white">
        <p className="text-slate-400 mb-4 text-center">
          Vui lòng đăng nhập để thanh toán khóa học.
        </p>
        <LoginLink className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950">
          Đăng nhập
        </LoginLink>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-4">
        <p>Không tìm thấy khóa học.</p>
        <Link to="/courses" className="text-cyan-400 hover:underline">
          Về danh sách khóa học
        </Link>
      </div>
    );
  }

  if (amounts.isFree) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-4">
        <p>Khóa học miễn phí — không cần thanh toán.</p>
        <Link
          to={`/courses/${slug}`}
          className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  const currentStepForBar = doneOrder ? 3 : step;

  return (
    <div className="relative min-h-[calc(100dvh-7rem)] bg-slate-950 text-white overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.18),transparent),radial-gradient(ellipse_50%_40%_at_100%_20%,rgba(251,146,60,0.1),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60"
      />

      <div className="relative z-[1] container mx-auto px-4 py-6 sm:py-10 max-w-6xl">
        <Link
          to={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại khóa học
        </Link>

        <div className="mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 ring-1 ring-amber-400/30">
            <Sparkles className="h-3 w-3" />
            Thanh toán
          </span>
        </div>

        <StepIndicator currentStep={currentStepForBar} />

        {doneOrder ? (
          <div className="max-w-lg mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              Hoàn tất — khóa học đã kích hoạt
            </h1>
            <p className="text-sm text-slate-400 mb-4">
              Cảm ơn bạn. Email xác nhận được gửi khi máy chủ cấu hình SMTP.
            </p>
            <p className="text-xs font-mono text-slate-500 break-all mb-6">
              Mã đơn: {String(doneOrder.order?._id || doneOrder._id)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {doneOrder.firstLessonId ? (
                <Link
                  to={`/learning/${slug}/${doneOrder.firstLessonId}`}
                  className="inline-flex justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950"
                >
                  Vào học ngay
                </Link>
              ) : null}
              <Link
                to={`/courses/${slug}`}
                className="inline-flex justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Trang khóa học
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-start">
            {/* Chi tiết đơn — cột trái */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-white/5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3 mb-4">
                  Chi tiết đơn hàng
                </h2>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  Thông tin khách hàng
                </h3>
                <p className="text-sm text-slate-200">
                  <span className="text-slate-500">Tên: </span>
                  {user?.fullName || user?.username || "—"}
                </p>
                <p className="text-sm text-slate-200 mt-1">
                  <span className="text-slate-500">Email: </span>
                  {user?.email || "—"}
                </p>

                <h3 className="text-xs font-semibold text-slate-500 uppercase mt-5 mb-2">
                  Sản phẩm (1)
                </h3>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white leading-snug">
                      {course.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
                      {String(course._id).slice(-12)} × 1
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-baseline">
                  <span className="text-sm text-slate-400">Tổng cộng</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">
                      {formatVnd(amounts.pay)}
                    </p>
                    {amounts.hasSale ? (
                      <p className="text-xs text-slate-500 line-through">
                        {formatVnd(amounts.list)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  Đơn hàng được xác nhận sau khi chuyển khoản đúng số tiền và nội
                  dung, hoặc khi bạn bấm hoàn tất trên bước thanh toán.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Thanh toán an toàn
                </span>
              </div>
            </div>

            {/* Cột phải: bước 1 CTA hoặc bước 2 CK */}
            <div className="lg:col-span-3 space-y-4">
              {step === 1 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Thông tin đơn hàng
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Kiểm tra lại khóa học và tổng tiền. Bấm tiếp tục để xem QR
                    và nội dung chuyển khoản.
                  </p>
                  <button
                    type="button"
                    onClick={() => void goToPaymentStep()}
                    disabled={preparingOrder}
                    className="w-full rounded-full py-3.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:from-amber-300 hover:via-orange-300 hover:to-rose-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {preparingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo đơn…
                      </>
                    ) : (
                      "Tiếp tục thanh toán"
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 space-y-5">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Thông tin chuyển khoản
                    </h2>

                    <div>
                      <h3 className="text-sm font-semibold text-cyan-300/90 mb-2">
                        QR Code thanh toán
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Quét mã QR để chuyển khoản
                      </p>
                      {bankBlock.qrUrl ? (
                        <div className="flex justify-center rounded-xl bg-white p-3">
                          <img
                            src={bankBlock.qrUrl}
                            alt="QR thanh toán"
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                          Admin chưa cấu hình QR. Vẫn có thể chuyển khoản thủ
                          công theo STK bên dưới.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 text-sm border-t border-white/10 pt-5">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">
                          Ngân hàng:
                        </span>
                        <span className="font-medium text-white text-right">
                          {bankBlock.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">
                          Số tài khoản:
                        </span>
                        <span className="font-mono font-semibold text-white text-right break-all">
                          {bankBlock.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">
                          Chủ tài khoản:
                        </span>
                        <span className="font-medium text-white text-right">
                          {bankBlock.accountName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">
                          Số tiền:
                        </span>
                        <span className="font-bold text-emerald-400 text-right">
                          {formatVnd(amounts.pay)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-amber-500/25 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-slate-400 text-xs uppercase tracking-wide">
                            Nội dung chuyển khoản:
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(transferMemo)}
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20"
                          >
                            <Copy className="h-3 w-3" />
                            Sao chép
                          </button>
                        </div>
                        <p className="text-sm font-mono text-amber-50 break-all font-semibold">
                          {transferMemo || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100 leading-relaxed">
                      ⚠️ Vui lòng nhập <strong>chính xác</strong> nội dung chuyển
                      khoản như trên để đối soát nhanh và tránh nhầm đơn.
                    </div>

                    <div className="flex gap-2 text-xs text-slate-400 leading-relaxed border-t border-white/10 pt-4">
                      <Clock className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                      <p>
                        Sau khi chuyển khoản, hệ thống kiểm tra định kỳ (mỗi vài
                        giây). Nếu sau <strong>30 giây</strong> chưa thấy cập nhật,
                        bấm{" "}
                        <strong className="text-slate-200">
                          Kiểm tra thủ công
                        </strong>{" "}
                        bên dưới. Sau khi bạn đã CK xong, hãy bấm{" "}
                        <strong className="text-slate-200">
                          Đã hoàn tất chuyển khoản
                        </strong>{" "}
                        để mở khóa học ngay trên tài khoản của bạn.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => void checkPaymentManual()}
                        disabled={checkingPayment}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
                      >
                        {checkingPayment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Kiểm tra thủ công
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCompleteTransfer()}
                    disabled={submitting}
                    className="w-full rounded-full py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:from-amber-300 hover:via-orange-300 hover:to-rose-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý…
                      </>
                    ) : (
                      "Đã hoàn tất chuyển khoản — mở khóa học"
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-500">
                    Chỉ bấm sau khi bạn đã chuyển đúng số tiền và nội dung CK.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCheckoutPage;
