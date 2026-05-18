import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import authService from "../../../../services/authService";
import enrollmentService from "../../../../services/enrollmentService";
import {
  formatCurrency,
  formatDateShort,
} from "../../../../features/dashboard/utils/formatters";

const PAYMENT_STATUS_LABEL = {
  paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
  partial: {
    label: "Thanh toán một phần",
    className: "bg-amber-100 text-amber-800",
  },
  unpaid: { label: "Chưa thanh toán", className: "bg-red-100 text-red-800" },
};

const PAYMENT_METHOD_LABEL = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  card: "Thẻ",
  other: "Khác",
};

const getStatusBadge = (status) =>
  PAYMENT_STATUS_LABEL[status] || PAYMENT_STATUS_LABEL.unpaid;

const resolveClassName = (enrollment) =>
  enrollment?.classId?.className || "—";

const resolveFee = (enrollment) => {
  const fee = Number(enrollment?.feeAmount);
  if (Number.isFinite(fee) && fee > 0) return fee;
  return Number(enrollment?.classId?.fee) || 0;
};

const resolveDebt = (enrollment) => {
  const fee = resolveFee(enrollment);
  const paid = Number(enrollment?.paidAmount) || 0;
  return Math.max(fee - paid, 0);
};

const TuitionPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadTuition = useCallback(async () => {
    const user = authService.getCurrentUser();
    const studentId = user?.linkedStudentId;

    if (!studentId) {
      setError(
        "Tài khoản chưa liên kết hồ sơ học viên. Vui lòng liên hệ trung tâm để được hỗ trợ.",
      );
      setEnrollments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await enrollmentService.getByStudent(studentId);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (e) {
      setEnrollments([]);
      setError(
        e?.response?.data?.message ||
          e?.apiMessage ||
          "Không thể tải thông tin học phí.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTuition();
  }, [loadTuition]);

  const summary = useMemo(() => {
    return enrollments.reduce(
      (acc, row) => {
        const fee = resolveFee(row);
        const paid = Number(row?.paidAmount) || 0;
        const debt = resolveDebt(row);
        acc.totalFee += fee;
        acc.totalPaid += paid;
        acc.totalDebt += debt;
        if (row.paymentStatus === "paid") acc.paidCount += 1;
        else if (row.paymentStatus === "partial") acc.partialCount += 1;
        else acc.unpaidCount += 1;
        return acc;
      },
      {
        totalFee: 0,
        totalPaid: 0,
        totalDebt: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
      },
    );
  }, [enrollments]);

  const allPayments = useMemo(() => {
    const rows = [];
    enrollments.forEach((enrollment) => {
      const history = Array.isArray(enrollment.paymentHistory)
        ? enrollment.paymentHistory
        : [];
      history.forEach((payment, index) => {
        rows.push({
          key: `${enrollment._id}-${index}`,
          className: resolveClassName(enrollment),
          ...payment,
        });
      });
    });
    return rows.sort(
      (a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0),
    );
  }, [enrollments]);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-7 h-7 text-primary" />
          Học phí
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi học phí theo lớp, trạng thái thanh toán và lịch sử đóng tiền.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Đang tải dữ liệu học phí...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Tổng học phí
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(summary.totalFee)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {enrollments.length} lớp ghi danh
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Đã thanh toán
              </p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {formatCurrency(summary.totalPaid)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.paidCount} đã xong · {summary.partialCount} một phần
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Còn nợ
              </p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {formatCurrency(summary.totalDebt)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.unpaidCount} chưa thanh toán
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Học phí theo lớp
            </h2>
            {enrollments.length === 0 && !error ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                Chưa có ghi danh lớp nào. Liên hệ trung tâm nếu bạn đang học
                offline.
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => {
                  const badge = getStatusBadge(enrollment.paymentStatus);
                  const fee = resolveFee(enrollment);
                  const paid = Number(enrollment.paidAmount) || 0;
                  const debt = resolveDebt(enrollment);
                  const history = Array.isArray(enrollment.paymentHistory)
                    ? enrollment.paymentHistory
                    : [];
                  const isOpen = expandedId === enrollment._id;

                  return (
                    <div
                      key={enrollment._id}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {resolveClassName(enrollment)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Ghi danh:{" "}
                            {formatDateShort(enrollment.enrollmentDate)}
                            {enrollment.paymentDueDate ? (
                              <>
                                {" "}
                                · Hạn:{" "}
                                {formatDateShort(enrollment.paymentDueDate)}
                              </>
                            ) : null}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="px-4 pb-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Học phí
                          </span>
                          <span className="font-medium">
                            {formatCurrency(fee)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Đã đóng
                          </span>
                          <span className="font-medium text-green-700">
                            {formatCurrency(paid)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Còn lại
                          </span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(debt)}
                          </span>
                        </div>
                      </div>

                      {history.length > 0 && (
                        <div className="border-t border-border">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isOpen ? null : enrollment._id)
                            }
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-primary hover:bg-muted/50"
                          >
                            Lịch sử thanh toán ({history.length})
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 space-y-2">
                              {[...history]
                                .sort(
                                  (a, b) =>
                                    new Date(b.paidAt || 0) -
                                    new Date(a.paidAt || 0),
                                )
                                .map((payment, idx) => (
                                  <div
                                    key={`${enrollment._id}-ph-${idx}`}
                                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                                  >
                                    <div>
                                      <span className="font-medium text-foreground">
                                        {formatCurrency(payment.amount)}
                                      </span>
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        {PAYMENT_METHOD_LABEL[payment.method] ||
                                          payment.method ||
                                          "—"}
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                      {formatDateShort(payment.paidAt)}
                                    </span>
                                    {payment.note ? (
                                      <p className="w-full text-xs text-muted-foreground">
                                        {payment.note}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {allPayments.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Lịch sử thanh toán (tất cả lớp)
              </h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Ngày
                        </th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Lớp
                        </th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Số tiền
                        </th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Hình thức
                        </th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allPayments.map((row) => (
                        <tr key={row.key} className="hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateShort(row.paidAt)}
                          </td>
                          <td className="px-4 py-3">{row.className}</td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {PAYMENT_METHOD_LABEL[row.method] ||
                              row.method ||
                              "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TuitionPage;
