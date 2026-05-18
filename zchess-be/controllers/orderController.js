const Order = require("../models/Order");
const Course = require("../models/Course");
const CourseAccess = require("../models/CourseAccess");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const asyncHandler = require("../middleware/asyncHandler");
const {
  notifyAdmins,
  notifyUsers,
} = require("../modules/notifications/helpers/notifyUsers");
const { logAction } = require("../services/auditLogger");
const { sendMailIfConfigured } = require("../services/emailService");
const Setting = require("../models/Setting");
const {
  buildPurchaseActivationEmail,
  formatViTimestamp,
} = require("../services/orderPurchaseEmailTemplate");

function assertOrderAccess(order, user) {
  if (!user) return false;
  if (user.role === "Admin") return true;
  return String(order.userId) === String(user._id);
}

function appBaseUrl() {
  const raw = String(
    process.env.CLIENT_URL || process.env.FRONTEND_URL || "",
  ).trim();
  return raw.replace(/\/$/, "") || "http://localhost:5173";
}

/** Task: Link học đầu tiên cho email + thông báo — Author: DucManh-BlueOC */
async function getFirstLessonTargetPath(firstCourseOrId) {
  const cid = firstCourseOrId?._id || firstCourseOrId;
  if (!cid) return "/courses";
  let slug = firstCourseOrId?.slug;
  if (!slug) {
    const c = await Course.findById(cid).select("slug");
    slug = c?.slug || "";
  }
  const chapter = await Chapter.findOne({ courseId: cid }).sort({ order: 1 });
  if (!chapter) return slug ? `/courses/${slug}` : "/courses";
  const lesson = await Lesson.findOne({ chapterId: chapter._id }).sort({
    order: 1,
  });
  if (!lesson) return slug ? `/courses/${slug}` : "/courses";
  return slug ? `/learning/${slug}/${lesson._id}` : "/courses";
}

/**
 * Task: Nội dung CK duy nhất theo đơn (tham khảo shop: …_79K) — Author: DucManh-BlueOC
 */
async function computeTransferMemoForOrder(order) {
  const settings = await Setting.findOne({ singletonKey: "system" })
    .select("paymentTransferPrefix")
    .lean();
  let prefix = String(settings?.paymentTransferPrefix || "ZC")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!prefix) prefix = "ZC";
  prefix = prefix.slice(0, 8);
  const hex = String(order._id || "").replace(/[^a-f0-9]/gi, "");
  const mid = hex.slice(-10).toUpperCase() || "ORDER";
  const total = Number(order.totalAmount || 0);
  const k = Math.max(1, Math.round(total / 1000));
  return `${prefix}${mid}_${k}K`;
}

async function orderToClientJson(orderDoc) {
  if (!orderDoc) return null;
  const plain = orderDoc.toObject ? orderDoc.toObject() : { ...orderDoc };
  try {
    plain.transferMemo = await computeTransferMemoForOrder(orderDoc);
  } catch {
    plain.transferMemo = "";
  }
  return plain;
}

async function grantCourseAccessForCompletedOrder(order, grantedBy) {
  const accessRows = (order.items || [])
    .filter((item) => item?.courseId)
    .map((item) => ({
      courseId: item.courseId,
      userId: order.userId,
      grantedBy: grantedBy || undefined,
    }));
  if (accessRows.length === 0) return;
  await CourseAccess.bulkWrite(
    accessRows.map((row) => ({
      updateOne: {
        filter: { courseId: row.courseId, userId: row.userId },
        update: { $setOnInsert: row },
        upsert: true,
      },
    })),
  );
}

/**
 * Thông báo in-app + email (khi có SMTP) cho người mua — mọi role.
 * Task: Sau CK QR — khách xem khóa ngay + mail — Author: DucManh-BlueOC
 */
async function notifyBuyerOrderFulfilled(order, options = {}) {
  const {
    createdBy,
    notificationType = "ORDER_COMPLETED",
    title: titleOverride,
    contentPrefix = "",
  } = options;

  const buyer = await User.findById(order.userId).select(
    "_id role fullName username email",
  );
  if (!buyer) return;

  const courseIds = (order.items || [])
    .map((item) => item?.courseId)
    .filter(Boolean);
  if (!courseIds.length) return;

  const courses = await Course.find({ _id: { $in: courseIds } }).select(
    "title slug",
  );
  const titleMap = new Map(
    courses.map((c) => [String(c._id), c.title || "Khóa học"]),
  );
  const titles = courseIds.map((id) => titleMap.get(String(id))).filter(Boolean);
  const firstCourse = courses[0];
  const firstPath = await getFirstLessonTargetPath(firstCourse || courseIds[0]);
  const shortOrderId = String(order._id).slice(-6).toUpperCase();
  const orderTag = `ORD-${shortOrderId}`;
  const base = appBaseUrl();
  const absUrl = `${base}${firstPath.startsWith("/") ? firstPath : `/${firstPath}`}`;

  const branding = await Setting.findOne({ singletonKey: "system" })
    .select("centerName email hotline")
    .lean();
  const brandName =
    String(branding?.centerName || "").trim() ||
    String(process.env.MAIL_BRAND_NAME || "").trim() ||
    "Z Chess";

  const introLine =
    `${contentPrefix}Đơn #${orderTag} của bạn đã được kích hoạt xong. Bạn có thể vào học ngay${titles.length ? ` — ${titles.join(", ")}` : ""}.`.trim();

  const inAppTitle =
    titleOverride || `Đơn #${orderTag} đã kích hoạt thành công`;
  const inAppContent = introLine;

  await notifyUsers({
    recipients: [buyer],
    title: inAppTitle,
    content: inAppContent,
    targetPath: firstPath,
    createdBy: createdBy || buyer._id,
    type: notificationType,
  });

  const email = String(buyer.email || "").trim();
  if (!email || /@zchess\.com$/i.test(email)) return;

  const { subject, html, text } = buildPurchaseActivationEmail({
    orderTag,
    brandName,
    buyerName: buyer.fullName || buyer.username || "bạn",
    introLine,
    courses: courses.map((c) => ({
      title: c.title || "Khóa học",
      slug: c.slug,
    })),
    learnUrl: absUrl,
    supportEmail: branding?.email,
    supportHotline: branding?.hotline,
    sentAtLabel: formatViTimestamp(new Date()),
  });

  await sendMailIfConfigured({
    to: email,
    subject,
    text,
    html,
  });
}

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, customerConfirmedBankTransfer } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items in order" });
  }

  const autoFulfill =
    customerConfirmedBankTransfer === true &&
    String(paymentMethod || "bank_transfer").toLowerCase() === "bank_transfer";

  let totalAmount = 0;
  const orderItems = [];
  const courseTitles = [];

  for (const item of items) {
    const existingCompletedOrder = await Order.findOne({
      userId,
      status: "completed",
      "items.courseId": item.courseId,
    });
    if (existingCompletedOrder) {
      return res.status(200).json(await orderToClientJson(existingCompletedOrder));
    }

    const existingPendingOrder = await Order.findOne({
      userId,
      status: "pending",
      "items.courseId": item.courseId,
    });
    if (existingPendingOrder) {
      if (autoFulfill) {
        existingPendingOrder.status = "completed";
        existingPendingOrder.paidAt = new Date();
        if (paymentMethod) {
          existingPendingOrder.paymentMethod = paymentMethod;
        }
        await existingPendingOrder.save();
        await grantCourseAccessForCompletedOrder(existingPendingOrder, null);
        try {
          await notifyBuyerOrderFulfilled(existingPendingOrder, {
            createdBy: userId,
            notificationType: "ORDER_BANK_TRANSFER_CONFIRMED",
            contentPrefix: "Cảm ơn bạn! ",
          });
        } catch (notifyError) {
          console.error("notifyBuyerOrderFulfilled (pending→done):", notifyError);
        }
        try {
          const sid = String(existingPendingOrder._id).slice(-6).toUpperCase();
          await notifyAdmins({
            title: "Đơn chuyển khoản tự hoàn tất",
            content: `ORD-${sid}: khách xác nhận CK, hệ thống đã cấp quyền học.`,
            targetPath: "/finance",
            createdBy: userId,
            type: "ORDER_AUTO_COMPLETED",
          });
        } catch (e) {
          console.error("notifyAdmins auto-complete:", e);
        }
        return res.status(200).json(await orderToClientJson(existingPendingOrder));
      }
      return res.status(200).json(await orderToClientJson(existingPendingOrder));
    }

    const course = await Course.findById(item.courseId);
    if (!course) {
      return res
        .status(404)
        .json({ message: `Course not found: ${item.courseId}` });
    }
    const price = course.salePrice > 0 ? course.salePrice : course.price;
    totalAmount += price;
    courseTitles.push(course.title || "Khóa học");
    orderItems.push({
      courseId: course._id,
      price: price,
    });
  }

  const order = new Order({
    userId,
    items: orderItems,
    totalAmount,
    paymentMethod,
    status: autoFulfill ? "completed" : "pending",
    paidAt: autoFulfill ? new Date() : null,
  });

  const savedOrder = await order.save();

  if (autoFulfill) {
    await grantCourseAccessForCompletedOrder(savedOrder, null);
    try {
      await notifyBuyerOrderFulfilled(savedOrder, {
        createdBy: userId,
        notificationType: "ORDER_BANK_TRANSFER_CONFIRMED",
        contentPrefix: "Cảm ơn bạn! ",
      });
    } catch (notifyError) {
      console.error("notifyBuyerOrderFulfilled (new completed):", notifyError);
    }
    try {
      const buyerName =
        req.user?.fullName || req.user?.username || "Người dùng";
      const sid = String(savedOrder._id).slice(-6).toUpperCase();
      await notifyAdmins({
        title: "Đơn mới tự hoàn tất (CK)",
        content: `${buyerName} — ORD-${sid} (${courseTitles.join(", ")}). Khách đã xác nhận chuyển khoản; quyền học đã mở.`,
        targetPath: "/finance",
        createdBy: userId,
        type: "ORDER_AUTO_COMPLETED",
      });
    } catch (notifyError) {
      console.error("Failed to notify admins for auto order:", notifyError);
    }
  } else {
    try {
      const buyerName =
        req.user?.fullName || req.user?.username || "Người dùng";
      const shortOrderId = String(savedOrder._id).slice(-6).toUpperCase();
      await notifyAdmins({
        title: "Đơn hàng khóa học mới chờ duyệt",
        content: `${buyerName} vừa tạo đơn ORD-${shortOrderId} (${courseTitles.join(", ")}). Vui lòng vào Tài chính để duyệt.`,
        targetPath: "/finance",
        createdBy: userId,
        type: "ORDER_PENDING_CREATED",
      });
    } catch (notifyError) {
      console.error("Failed to notify admins for pending order:", notifyError);
    }
  }

  res.status(201).json(await orderToClientJson(savedOrder));
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("userId", "fullName email")
    .populate("items.courseId", "title thumbnail");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!assertOrderAccess(order, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(await orderToClientJson(order));
});

exports.getMyOrdersForAuthUser = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).populate(
    "items.courseId",
    "title thumbnail",
  );
  res.json(orders);
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    userId: req.params.userId,
  }).populate("items.courseId", "title thumbnail");
  res.json(orders);
});

exports.listAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("userId", "fullName email")
    .populate("items.courseId", "title thumbnail");
  res.json(orders);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, transactionId } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!assertOrderAccess(order, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
  if (status !== undefined && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Chỉ Admin mới có quyền duyệt trạng thái đơn hàng." });
  }

  const previousStatus = order.status;
  order.status = status || order.status;
  order.transactionId = transactionId || order.transactionId;
  if (status === "completed") {
    order.paidAt = new Date();
  } else if (status && status !== "completed") {
    order.paidAt = null;
  }

  const updatedOrder = await order.save();

  if (updatedOrder.status === "completed") {
    await grantCourseAccessForCompletedOrder(updatedOrder, req.user?._id);

    if (isAdmin && previousStatus !== "completed") {
      try {
        await notifyBuyerOrderFulfilled(updatedOrder, {
          createdBy: req.user._id,
          notificationType: "ORDER_APPROVED",
          title: "Đơn hàng khóa học đã được duyệt",
          contentPrefix: "Admin đã xác nhận thanh toán. ",
        });
      } catch (notifyError) {
        console.error("Failed to notify buyer on order approval:", notifyError);
      }
    }
  }
  res.json(updatedOrder);
});

/**
 * refundOrder — Admin only.
 * body: { amount?: number, reason?: string }
 *   - amount missing hoặc >= remaining → refund full → status `refunded`
 *   - 0 < amount < remaining           → status `partially_refunded`
 * Tác dụng phụ:
 *   - Tạo Expense (chi phí hoàn tiền)
 *   - Revoke CourseAccess nếu full refund
 *   - Notify user + audit log
 */
exports.refundOrder = asyncHandler(async (req, res) => {
  if (String(req.user?.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Chỉ Admin được hoàn tiền." });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!["completed", "partially_refunded"].includes(order.status)) {
    return res.status(400).json({
      message: `Không thể hoàn tiền đơn ở trạng thái ${order.status}.`,
    });
  }

  const total = Number(order.totalAmount || 0);
  const alreadyRefunded = Number(order.refundAmount || 0);
  const remaining = Math.max(total - alreadyRefunded, 0);
  if (remaining <= 0) {
    return res.status(400).json({ message: "Đơn đã hoàn đủ." });
  }

  const requested = Number(req.body?.amount);
  const refundAmount =
    Number.isFinite(requested) && requested > 0
      ? Math.min(requested, remaining)
      : remaining;

  const before = order.toObject();
  const newTotalRefunded = alreadyRefunded + refundAmount;
  order.refundAmount = newTotalRefunded;
  order.refundedAt = new Date();
  order.refundReason = String(req.body?.reason || "").slice(0, 500);
  order.refundedBy = req.user._id;
  order.status =
    newTotalRefunded >= total ? "refunded" : "partially_refunded";
  await order.save();

  // Revoke quyền học khi full refund
  if (order.status === "refunded") {
    const courseIds = (order.items || [])
      .map((item) => item?.courseId)
      .filter(Boolean);
    if (courseIds.length > 0) {
      await CourseAccess.deleteMany({
        userId: order.userId,
        courseId: { $in: courseIds },
      });
    }
  }

  // Tạo Expense
  try {
    await Expense.create({
      expenseId: Date.now(),
      date: new Date(),
      category: "REFUND",
      amount: refundAmount,
      description: `Hoàn tiền đơn ORD-${String(order._id).slice(-6).toUpperCase()}: ${order.refundReason || ""}`,
      paymentMethod: order.paymentMethod || "other",
      approvedBy: req.user._id,
    });
  } catch (expenseErr) {
    console.error("refund_create_expense_failed", expenseErr?.message);
  }

  await logAction({
    req,
    action: "order.refund",
    entity: "Order",
    entityId: order._id,
    before,
    after: order.toObject(),
    metadata: {
      refundAmount,
      newTotalRefunded,
      remaining: Math.max(total - newTotalRefunded, 0),
    },
  });

  try {
    await notifyUsers({
      userIds: [order.userId],
      title: "Đơn hàng đã được hoàn tiền",
      content: `Đơn ORD-${String(order._id).slice(-6).toUpperCase()} đã được hoàn ${refundAmount.toLocaleString("vi-VN")}đ.${
        order.status === "refunded" ? " Quyền truy cập khóa học liên quan đã bị thu hồi." : ""
      }`,
      targetPath: "/orders",
      createdBy: req.user._id,
      type: "ORDER_REFUNDED",
    });
  } catch (notifyErr) {
    console.error("refund_notify_failed", notifyErr?.message);
  }

  res.json(order);
});
