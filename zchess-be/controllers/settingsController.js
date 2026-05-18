const asyncHandler = require("../middleware/asyncHandler");
const Setting = require("../models/Setting");
const HeroSetting = require("../models/HeroSetting");

const DEFAULT_SETTINGS = {
  singletonKey: "system",
  logoUrl: "",
  centerName: "Z Chess",
  address: "",
  hotline: "",
  email: "",
  workingHours: "",
  bankName: "Techcombank",
  bankAccountNumber: "",
  bankAccountName: "",
  paymentQrUrl: "",
  paymentTransferPrefix: "KHOAHOC",
  announcement_enabled: false,
  announcement_text: "",
  announcement_bg_color: "#ff0000",
  announcement_text_color: "#ffffff",
  social_proof_toast_enabled: false,
  publicCms: {
    theme: {
      fontFamily: "inherit",
      primaryColor: "#2563EB",
      secondaryColor: "#0F172A",
      accentColor: "#CA8A04",
      textColor: "#0F172A",
      mutedTextColor: "#64748B",
      buttonRadius: "12px",
    },
    home: {
      hero: {},
      courses: {},
      teachers: {},
      news: {},
      testimonials: {},
      contact: {},
      cta: {},
    },
    courseStore: {},
    courseDetail: {},
    teachersPage: {},
    newsPage: {},
    contactPage: {},
  },
};

const sanitizePatch = (body = {}) => {
  const patch = {};
  const fields = [
    "logoUrl",
    "centerName",
    "address",
    "hotline",
    "email",
    "workingHours",
    "bankName",
    "bankAccountNumber",
    "bankAccountName",
    "paymentQrUrl",
    "paymentTransferPrefix",
    "announcement_enabled",
    "announcement_text",
    "announcement_bg_color",
    "announcement_text_color",
    "social_proof_toast_enabled",
  ];

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      if (field === "announcement_enabled" || field === "social_proof_toast_enabled") {
        const v = body[field];
        patch[field] =
          v === true || v === "true" || v === 1 || v === "1";
      } else {
        patch[field] = String(body[field] ?? "").trim();
      }
    }
  });
  if (body.publicCms && typeof body.publicCms === "object") {
    patch.publicCms = body.publicCms;
  }
  return patch;
};

const ensureSingletonSettings = async () => {
  let settings = await Setting.findOneAndUpdate(
    { singletonKey: "system" },
    { $setOnInsert: DEFAULT_SETTINGS },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  // Task: Bản ghi cũ thiếu key — $setOnInsert không bổ sung; refetch sau khi backfill để Mongoose/JSON đúng — Author: DucManh-BlueOC
  const mig = await Setting.updateOne(
    {
      singletonKey: "system",
      social_proof_toast_enabled: { $exists: false },
    },
    { $set: { social_proof_toast_enabled: false } },
  );
  if (mig.modifiedCount > 0) {
    settings = await Setting.findOne({ singletonKey: "system" });
  }
  return settings;
};

const mapLegacyHeroToCms = (hero) => {
  if (!hero) return null;
  return {
    ...DEFAULT_SETTINGS.publicCms,
    home: {
      ...DEFAULT_SETTINGS.publicCms.home,
      hero: {
        badgeText: hero.badgeText || "🏆 Trung tâm Cờ Vua hàng đầu",
        title:
          hero.title || "Phát triển tư duy chiến lược cho thế hệ tương lai",
        highlightedText: hero.highlightedText || "tư duy chiến lược",
        description:
          hero.description ||
          "Z Chess mang đến chương trình đào tạo cờ vua chất lượng cao, giúp trẻ em phát triển tư duy logic, khả năng tập trung và kỹ năng giải quyết vấn đề.",
        primaryButtonText: hero.primaryButtonText || "Khám phá khóa học",
        primaryButtonLink: hero.primaryButtonLink || "/courses",
        secondaryButtonText: hero.secondaryButtonText || "Xem video giới thiệu",
        secondaryButtonLink: hero.secondaryButtonLink || "",
        mediaType: hero.mediaType || "image",
        mediaUrl: hero.mediaUrl || "",
        mediaPosterUrl: hero.mediaPosterUrl || "",
        floatingCardTitle: hero.floatingCardTitle || "Học thử miễn phí",
        floatingCardSubtitle: hero.floatingCardSubtitle || "2 buổi đầu tiên",
        ratingValue: hero.ratingValue || "4.9/5",
        ratingText: hero.ratingText || "200+ đánh giá",
        stats: Array.isArray(hero.stats) ? hero.stats : [],
        sectionBgColor: hero.sectionBgColor || "#F8FAFC",
        titleColor: hero.titleColor || "#0F172A",
        highlightColor: hero.highlightColor || "#CA8A04",
        descriptionColor: hero.descriptionColor || "#64748B",
        badgeBgColor: hero.badgeBgColor || "#BFDBFE",
        badgeTextColor: hero.badgeTextColor || "#2563EB",
        primaryButtonBgColor: hero.primaryButtonBgColor || "#2563EB",
        primaryButtonTextColor: hero.primaryButtonTextColor || "#FFFFFF",
        secondaryButtonTextColor: hero.secondaryButtonTextColor || "#0F172A",
        secondaryButtonBorderColor:
          hero.secondaryButtonBorderColor || "#CBD5E1",
        fontFamily: hero.fontFamily || "inherit",
      },
    },
  };
};

const ensurePublicCms = async (settingsDoc) => {
  if (settingsDoc.publicCms) return settingsDoc.publicCms;
  const heroDoc = await HeroSetting.findOne();
  const mapped = mapLegacyHeroToCms(heroDoc);
  settingsDoc.publicCms = mapped || DEFAULT_SETTINGS.publicCms;
  await settingsDoc.save();
  return settingsDoc.publicCms;
};

/**
 * Thông tin CK/QR: không đưa vào payload hoàn toàn public (khách chưa đăng nhập),
 * nhưng merge cho user đã đăng nhập để trang checkout lấy được STK — Author: DucManh-BlueOC
 */
const CHECKOUT_FIELDS_FOR_AUTH = [
  "bankName",
  "bankAccountNumber",
  "bankAccountName",
  "paymentQrUrl",
  "paymentTransferPrefix",
];

const mergeCheckoutFieldsForAuth = (plain, settingsDoc) => {
  if (!plain || !settingsDoc) return plain;
  const full =
    settingsDoc.toObject?.({ flattenMaps: true }) ?? settingsDoc;
  CHECKOUT_FIELDS_FOR_AUTH.forEach((field) => {
    if (full[field] !== undefined) plain[field] = full[field];
  });
  return plain;
};

/**
 * Public-safe subset of system settings.
 *
 * Bí mật vận hành (số tài khoản, prefix chuyển khoản, QR thanh toán,
 * Public CMS draft) chỉ dành cho Admin.
 */
const PUBLIC_SETTING_FIELDS = [
  "logoUrl",
  "centerName",
  "address",
  "hotline",
  "email",
  "workingHours",
  "announcement_enabled",
  "announcement_text",
  "announcement_bg_color",
  "announcement_text_color",
];

const pickPublicSettings = (settings) => {
  if (!settings) return {};
  const plain = settings.toObject ? settings.toObject() : settings;
  const result = {};
  PUBLIC_SETTING_FIELDS.forEach((field) => {
    if (plain[field] !== undefined) result[field] = plain[field];
  });
  // Cờ toast: luôn có trong JSON public (kể cả DB chưa có field)
  result.social_proof_toast_enabled = Boolean(
    plain.social_proof_toast_enabled,
  );
  return result;
};

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSingletonSettings();
  const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
  const payload = isAdmin ? settings : pickPublicSettings(settings);
  const plain = payload?.toObject ? payload.toObject({ flattenMaps: true }) : payload;
  if (plain && typeof plain === "object") {
    plain.social_proof_toast_enabled = Boolean(plain.social_proof_toast_enabled);
  }
  if (!isAdmin && req.user?._id && plain && typeof plain === "object") {
    mergeCheckoutFieldsForAuth(plain, settings);
  }
  res.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.json({
    success: true,
    data: plain,
  });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const patch = sanitizePatch(req.body);
  const settings = await Setting.findOneAndUpdate(
    { singletonKey: "system" },
    { $set: patch, $setOnInsert: { singletonKey: "system" } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const data = settings?.toObject
    ? settings.toObject({ flattenMaps: true })
    : settings;
  if (data && typeof data === "object") {
    data.social_proof_toast_enabled = Boolean(data.social_proof_toast_enabled);
  }

  res.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.json({
    success: true,
    message: "Cập nhật cấu hình hệ thống thành công",
    data,
  });
});

exports.getPublicCms = asyncHandler(async (_req, res) => {
  const settings = await ensureSingletonSettings();
  const publicCms = await ensurePublicCms(settings);
  res.json({
    success: true,
    data: publicCms,
  });
});

exports.getAdminPublicCms = asyncHandler(async (_req, res) => {
  const settings = await ensureSingletonSettings();
  const publicCms = await ensurePublicCms(settings);
  res.json({
    success: true,
    data: publicCms,
  });
});

exports.updatePublicCms = asyncHandler(async (req, res) => {
  const settings = await ensureSingletonSettings();
  const previous = (await ensurePublicCms(settings)) || {};
  const incoming = req.body?.publicCms;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({
      success: false,
      message: "publicCms payload is required",
    });
  }
  settings.publicCms = {
    ...previous,
    ...incoming,
    theme: { ...(previous.theme || {}), ...(incoming.theme || {}) },
    home: { ...(previous.home || {}), ...(incoming.home || {}) },
    courseStore: {
      ...(previous.courseStore || {}),
      ...(incoming.courseStore || {}),
    },
    courseDetail: {
      ...(previous.courseDetail || {}),
      ...(incoming.courseDetail || {}),
    },
    teachersPage: {
      ...(previous.teachersPage || {}),
      ...(incoming.teachersPage || {}),
    },
    newsPage: { ...(previous.newsPage || {}), ...(incoming.newsPage || {}) },
    contactPage: {
      ...(previous.contactPage || {}),
      ...(incoming.contactPage || {}),
    },
  };
  if (incoming.home) {
    settings.publicCms.home = {
      ...(previous.home || {}),
      ...(incoming.home || {}),
      hero: { ...(previous.home?.hero || {}), ...(incoming.home?.hero || {}) },
      courses: {
        ...(previous.home?.courses || {}),
        ...(incoming.home?.courses || {}),
      },
      teachers: {
        ...(previous.home?.teachers || {}),
        ...(incoming.home?.teachers || {}),
      },
      news: { ...(previous.home?.news || {}), ...(incoming.home?.news || {}) },
      testimonials: {
        ...(previous.home?.testimonials || {}),
        ...(incoming.home?.testimonials || {}),
      },
      contact: {
        ...(previous.home?.contact || {}),
        ...(incoming.home?.contact || {}),
      },
      cta: { ...(previous.home?.cta || {}), ...(incoming.home?.cta || {}) },
    };
  }
  await settings.save();
  res.json({
    success: true,
    message: "Cập nhật Public CMS thành công",
    data: settings.publicCms,
  });
});
