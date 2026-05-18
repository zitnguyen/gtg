const asyncHandler = require("../middleware/asyncHandler");
const notificationFeedService = require("../modules/notifications/services/notificationFeedService");
const notificationFanoutService = require("../modules/notifications/services/notificationFanoutService");
const {
  validateCreatePayload,
} = require("../modules/notifications/validators/notificationValidator");

const handleHttpError = (res, error) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  throw error;
};

exports.createNotification = asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = validateCreatePayload(req.body || {});
  } catch (error) {
    return handleHttpError(res, error);
  }

  const { notification, recipientsCount, skipped } =
    await notificationFanoutService.fanoutToRoles({
      ...validated,
      createdBy: req.user._id,
    });

  if (!notification) {
    if (skipped) {
      return res
        .status(202)
        .json({ message: "Đã bỏ qua thông báo trùng lặp gần đây", skipped: true });
    }
    return res.status(400).json({ message: "Không tìm thấy người nhận phù hợp" });
  }

  res.status(201).json({
    ...notification.toObject(),
    recipientsCount,
  });
});

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { limit, before } = req.query || {};
  const feed = await notificationFeedService.getFeed(req.user._id, {
    limit,
    before,
  });
  res.json(feed);
});

exports.getNotificationDetail = asyncHandler(async (req, res) => {
  try {
    const detail = await notificationFeedService.getDetail(
      { userId: req.user._id, role: req.user.role },
      req.params.id,
    );
    return res.json(detail);
  } catch (error) {
    return handleHttpError(res, error);
  }
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const { isRead = true } = req.body || {};
  try {
    const result = await notificationFeedService.setReadState({
      userId: req.user._id,
      notificationId: req.params.id,
      isRead,
    });
    res.json({
      message: result.isRead
        ? "Đã đánh dấu đã đọc"
        : "Đã đánh dấu chưa đọc",
      isRead: result.isRead,
      readAt: result.readAt,
    });
  } catch (error) {
    return handleHttpError(res, error);
  }
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationFeedService.markAllRead(req.user._id);
  res.json({
    message: "Đã đánh dấu tất cả đã đọc",
    ...result,
  });
});
