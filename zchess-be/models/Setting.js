const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "system",
      unique: true,
      immutable: true,
    },
    logoUrl: { type: String, trim: true, default: "" },
    centerName: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    hotline: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    workingHours: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "Techcombank" },
    bankAccountNumber: { type: String, trim: true, default: "" },
    bankAccountName: { type: String, trim: true, default: "" },
    paymentQrUrl: { type: String, trim: true, default: "" },
    paymentTransferPrefix: { type: String, trim: true, default: "KHOAHOC" },
    announcement_enabled: { type: Boolean, default: false },
    announcement_text: { type: String, trim: true, default: "" },
    announcement_bg_color: { type: String, trim: true, default: "#ff0000" },
    announcement_text_color: { type: String, trim: true, default: "#ffffff" },
    /** Toast góc màn hình “vừa mua” (social proof) — Admin bật/tắt */
    social_proof_toast_enabled: { type: Boolean, default: false },
    publicCms: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
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
          courses: {
            badge: "Khóa học nổi bật",
            title: "Khóa học dành cho mọi cấp độ",
            description: "Lộ trình học cờ vua bài bản cho mọi học viên.",
          },
          teachers: {
            badge: "Đội ngũ",
            title: "Giáo viên xuất sắc",
            description:
              "Đội ngũ giáo viên giàu kinh nghiệm, đam mê và tận tâm với sự phát triển của từng học viên.",
          },
          news: {
            badge: "Tin tức",
            title: "Bản tin mới nhất",
            description:
              "Cập nhật thông tin và hoạt động nổi bật của trung tâm.",
          },
          testimonials: {
            badge: "Phụ huynh nói gì",
            title: "Đánh giá từ học viên và phụ huynh",
            description: "Những phản hồi chân thực từ cộng đồng học viên.",
          },
          contact: {
            badge: "Liên hệ",
            title: "Kết nối với chúng tôi",
            description: "Để lại thông tin, đội ngũ tư vấn sẽ liên hệ sớm.",
          },
          cta: {
            title: "Sẵn sàng bắt đầu hành trình cờ vua?",
            description: "Đăng ký học thử miễn phí ngay hôm nay.",
            buttonText: "Đăng ký tư vấn",
            buttonLink: "/contact",
          },
        },
        courseStore: {
          title: "Khoá học cờ vua",
          description: "Tìm khóa học phù hợp cho bạn.",
          heroBackground: "",
        },
        courseDetail: {
          overlayColor: "rgba(15, 23, 42, 0.78)",
          primaryButtonColor: "#DC2626",
          primaryButtonTextColor: "#FFFFFF",
        },
        teachersPage: {
          title: "Đội ngũ giáo viên",
          description: "Những người đồng hành cùng hành trình của học viên.",
          heroBackground: "",
        },
        newsPage: {
          title: "Tin tức cờ vua",
          description: "Các bài viết mới nhất từ trung tâm.",
          heroBackground: "",
        },
        contactPage: {
          title: "Liên hệ",
          description: "Chúng tôi luôn sẵn sàng hỗ trợ bạn.",
          heroBackground: "",
        },
      }),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
