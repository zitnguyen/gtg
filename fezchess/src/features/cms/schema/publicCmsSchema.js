// Config-driven CMS schema. Each "block" describes a logical group of fields
// that maps to a path inside the publicCms document. The editor renders blocks
// from this config — no JSX changes required to add a new editable section.
//
// Field types supported by FieldRenderer: text, textarea, color, media,
// number, select. All write through useFieldValue and persist via the
// existing PATCH /settings/public-cms endpoint.

const STYLE_FIELDS = (extra = []) => [
  { key: "fontFamily", label: "Kiểu chữ", type: "text", placeholder: "VD: Inter, Arial, sans-serif", group: "typography" },
  { key: "titleFontSize", label: "Cỡ chữ tiêu đề", type: "text", placeholder: "VD: 48px", group: "typography" },
  { key: "descriptionFontSize", label: "Cỡ chữ mô tả", type: "text", placeholder: "VD: 18px", group: "typography" },
  ...extra,
];

const PAGE_HERO_BLOCK = (id, basePath, title) => ({
  id,
  kind: "page-hero",
  title,
  subtitle: "Tiêu đề + mô tả + ảnh nền + cỡ chữ",
  basePath,
  fields: [
    { key: "title", label: "Tiêu đề trang", type: "text" },
    { key: "description", label: "Mô tả trang", type: "textarea" },
    { key: "heroBackground", label: "Ảnh nền (URL)", type: "media", accept: "image/png,image/jpeg" },
    ...STYLE_FIELDS(),
    { key: "pageBackgroundColor", label: "Màu nền trang", type: "color", group: "colors" },
    { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
    { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
  ],
});

export const publicCmsBlocks = {
  "theme.global": {
    id: "theme.global",
    kind: "theme",
    title: "Chủ đề toàn cục",
    subtitle: "Bảng màu và font áp dụng cho toàn bộ Public Site",
    basePath: "theme",
    fields: [
      { key: "fontFamily", label: "Kiểu chữ chung", type: "text", placeholder: "VD: Inter" },
      { key: "buttonRadius", label: "Bo tròn nút", type: "text", placeholder: "VD: 12px" },
      { key: "primaryColor", label: "Màu chính", type: "color", group: "colors" },
      { key: "secondaryColor", label: "Màu phụ", type: "color", group: "colors" },
      { key: "accentColor", label: "Màu nhấn", type: "color", group: "colors" },
      { key: "textColor", label: "Màu chữ", type: "color", group: "colors" },
      { key: "mutedTextColor", label: "Màu chữ phụ", type: "color", group: "colors" },
    ],
  },

  "home.hero": {
    id: "home.hero",
    kind: "hero",
    title: "Hero trang chủ",
    subtitle: "Nội dung + ảnh bìa + style chữ",
    basePath: "home.hero",
    fields: [
      { key: "badgeText", label: "Nhãn nhỏ (Badge)", type: "text", placeholder: "VD: Trung tâm Cờ Vua hàng đầu" },
      { key: "promoLine", label: "Dòng ưu đãi (thanh cam trên Hero)", type: "text", placeholder: "VD: Ưu đãi đăng ký sớm — tặng buổi học thử..." },
      { key: "title", label: "Tiêu đề Hero", type: "text", placeholder: "Nhập tiêu đề lớn của Hero" },
      { key: "highlightedText", label: "Từ/cụm từ highlight", type: "text", placeholder: "VD: tư duy chiến lược" },
      { key: "description", label: "Mô tả Hero", type: "textarea", placeholder: "Mô tả ngắn dưới tiêu đề Hero" },
      { key: "primaryButtonText", label: "Tên nút chính", type: "text", placeholder: "VD: Khám phá khóa học", group: "buttons" },
      { key: "primaryButtonLink", label: "Link nút chính", type: "text", placeholder: "VD: /courses", group: "buttons" },
      { key: "secondaryButtonText", label: "Tên nút phụ", type: "text", placeholder: "VD: Xem video giới thiệu", group: "buttons" },
      { key: "secondaryButtonLink", label: "Link nút phụ", type: "text", placeholder: "VD: https://...", group: "buttons" },
      { key: "mediaUrl", label: "Ảnh / Video Hero", type: "media", accept: "image/png,image/jpeg,video/mp4", group: "media" },
      { key: "titleFontSize", label: "Cỡ chữ tiêu đề Hero", type: "text", placeholder: "VD: 56px", group: "typography" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
    ],
  },

  "home.style": {
    id: "home.style",
    kind: "style",
    title: "Style trang chủ",
    subtitle: "Cỡ chữ, kiểu chữ cho riêng trang chủ",
    basePath: "home",
    fields: [
      ...STYLE_FIELDS(),
      { key: "pageBackgroundColor", label: "Nền trang", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề chung", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả chung", type: "color", group: "colors" },
      { key: "buttonColor", label: "Màu nút", type: "color", group: "colors" },
      { key: "buttonTextColor", label: "Màu chữ nút", type: "color", group: "colors" },
      { key: "iconColor", label: "Màu icon", type: "color", group: "colors" },
    ],
  },

  "home.courses": {
    id: "home.courses",
    kind: "section",
    title: "Khối Khóa học (Trang chủ)",
    subtitle: "Sửa chữ và nút khối Khóa học",
    basePath: "home.courses",
    fields: [
      { key: "badge", label: "Nhãn badge", type: "text", placeholder: "VD: Khóa học" },
      { key: "title", label: "Tiêu đề khối", type: "text", placeholder: "VD: Khóa học phổ biến" },
      { key: "description", label: "Mô tả khối", type: "textarea", placeholder: "Mô tả ngắn cho khối Khóa học" },
      { key: "buttonText", label: "Chữ nút", type: "text", placeholder: "VD: Xem tất cả khóa học →", group: "buttons" },
      { key: "cardButtonText", label: "Chữ nút card", type: "text", placeholder: "VD: Xem chi tiết", group: "buttons" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "badgeBgColor", label: "Nền badge", type: "color", group: "colors" },
      { key: "badgeTextColor", label: "Chữ badge", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
      { key: "buttonBgColor", label: "Nền nút", type: "color", group: "colors" },
      { key: "buttonTextColor", label: "Chữ nút", type: "color", group: "colors" },
      { key: "cardButtonBgColor", label: "Nền nút card", type: "color", group: "colors" },
      { key: "cardButtonTextColor", label: "Chữ nút card", type: "color", group: "colors" },
    ],
  },

  "home.teachers": {
    id: "home.teachers",
    kind: "section",
    title: "Khối Giáo viên (Trang chủ)",
    subtitle: "Sửa chữ khối Giáo viên",
    basePath: "home.teachers",
    fields: [
      { key: "badge", label: "Nhãn badge", type: "text", placeholder: "VD: Đội ngũ" },
      { key: "title", label: "Tiêu đề khối", type: "text", placeholder: "VD: Giáo viên xuất sắc" },
      { key: "description", label: "Mô tả khối", type: "textarea", placeholder: "Mô tả ngắn cho khối Giáo viên" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "badgeBgColor", label: "Nền badge", type: "color", group: "colors" },
      { key: "badgeTextColor", label: "Chữ badge", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
      { key: "actionButtonBgColor", label: "Nền nút action", type: "color", group: "colors" },
      { key: "actionButtonTextColor", label: "Chữ nút action", type: "color", group: "colors" },
    ],
  },

  "home.testimonials": {
    id: "home.testimonials",
    kind: "section",
    title: "Khối Đánh giá (Trang chủ)",
    subtitle: "Sửa chữ khối Đánh giá",
    basePath: "home.testimonials",
    fields: [
      { key: "badge", label: "Nhãn badge", type: "text", placeholder: "VD: Phản hồi" },
      { key: "title", label: "Tiêu đề khối", type: "text", placeholder: "VD: Phụ huynh nói gì về chúng tôi" },
      { key: "description", label: "Mô tả khối", type: "textarea", placeholder: "Mô tả ngắn cho khối Đánh giá" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "badgeBgColor", label: "Nền badge", type: "color", group: "colors" },
      { key: "badgeTextColor", label: "Chữ badge", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
    ],
  },

  "home.news": {
    id: "home.news",
    kind: "section",
    title: "Khối Tin tức (Trang chủ)",
    subtitle: "Sửa chữ và nút khối Tin tức",
    basePath: "home.news",
    fields: [
      { key: "title", label: "Tiêu đề khối", type: "text", placeholder: "VD: Tin Tức & Hoạt Động" },
      { key: "description", label: "Mô tả khối", type: "textarea", placeholder: "Mô tả ngắn cho khối Tin tức" },
      { key: "buttonText", label: "Chữ nút desktop", type: "text", placeholder: "VD: Xem tất cả", group: "buttons" },
      { key: "mobileButtonText", label: "Chữ nút mobile", type: "text", placeholder: "VD: Xem tất cả tin tức", group: "buttons" },
      { key: "cardButtonText", label: "Chữ nút card", type: "text", placeholder: "VD: Đọc thêm", group: "buttons" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
      { key: "buttonBgColor", label: "Nền nút", type: "color", group: "colors" },
      { key: "buttonTextColor", label: "Chữ nút", type: "color", group: "colors" },
      { key: "cardButtonTextColor", label: "Chữ nút card", type: "color", group: "colors" },
    ],
  },

  "home.contact": {
    id: "home.contact",
    kind: "section",
    title: "Khối Liên hệ (Trang chủ)",
    subtitle: "Sửa chữ của khối liên hệ trang chủ",
    basePath: "home.contact",
    fields: [
      { key: "badge", label: "Nhãn badge", type: "text", placeholder: "VD: Liên hệ" },
      { key: "title", label: "Tiêu đề khối", type: "text", placeholder: "VD: Đăng ký học thử" },
      { key: "highlightedText", label: "Từ highlight tiêu đề", type: "text", placeholder: "VD: miễn phí" },
      { key: "description", label: "Mô tả khối", type: "textarea", placeholder: "Mô tả dưới tiêu đề khối Liên hệ" },
      { key: "submitButtonText", label: "Chữ nút gửi form", type: "text", placeholder: "VD: Đăng ký học thử miễn phí", group: "buttons" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "badgeBgColor", label: "Nền badge", type: "color", group: "colors" },
      { key: "badgeTextColor", label: "Chữ badge", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "highlightColor", label: "Màu highlight", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
      { key: "submitButtonBgColor", label: "Nền nút gửi", type: "color", group: "colors" },
      { key: "submitButtonTextColor", label: "Chữ nút gửi", type: "color", group: "colors" },
    ],
  },

  "home.cta": {
    id: "home.cta",
    kind: "cta",
    title: "Khối CTA (Trang chủ)",
    subtitle: "Sửa toàn bộ chữ/nút của khối kêu gọi hành động",
    basePath: "home.cta",
    fields: [
      { key: "title", label: "Tiêu đề CTA", type: "text", placeholder: "VD: Bắt đầu hành trình cờ vua" },
      { key: "highlightedText", label: "Từ highlight tiêu đề", type: "text", placeholder: "VD: ngay hôm nay" },
      { key: "description", label: "Mô tả CTA", type: "textarea", placeholder: "Mô tả dưới tiêu đề CTA" },
      { key: "primaryButtonText", label: "Tên nút chính", type: "text", placeholder: "VD: Đăng ký học thử miễn phí", group: "buttons" },
      { key: "secondaryButtonText", label: "Tên nút phụ", type: "text", placeholder: "VD: Tìm hiểu thêm", group: "buttons" },
      { key: "trustItem1", label: "Badge tin cậy 1", type: "text", placeholder: "VD: Học thử miễn phí", group: "trust" },
      { key: "trustItem2", label: "Badge tin cậy 2", type: "text", placeholder: "VD: Không ràng buộc", group: "trust" },
      { key: "trustItem3", label: "Badge tin cậy 3", type: "text", placeholder: "VD: Hoàn tiền 100%", group: "trust" },
      { key: "sectionBgColor", label: "Nền section", type: "color", group: "colors" },
      { key: "cardBgColor", label: "Nền card", type: "color", group: "colors" },
      { key: "titleColor", label: "Màu tiêu đề", type: "color", group: "colors" },
      { key: "highlightColor", label: "Màu highlight", type: "color", group: "colors" },
      { key: "descriptionColor", label: "Màu mô tả", type: "color", group: "colors" },
      { key: "primaryButtonBgColor", label: "Nền nút chính", type: "color", group: "colors" },
      { key: "primaryButtonTextColor", label: "Chữ nút chính", type: "color", group: "colors" },
      { key: "secondaryButtonTextColor", label: "Chữ nút phụ", type: "color", group: "colors" },
      { key: "secondaryButtonBorderColor", label: "Viền nút phụ", type: "color", group: "colors" },
      { key: "trustTextColor", label: "Màu badge tin cậy", type: "color", group: "colors" },
    ],
  },

  "courseStore.hero": PAGE_HERO_BLOCK("courseStore.hero", "courseStore", "Trang Khóa học"),
  "teachersPage.hero": PAGE_HERO_BLOCK("teachersPage.hero", "teachersPage", "Trang Giáo viên"),
  "newsPage.hero": PAGE_HERO_BLOCK("newsPage.hero", "newsPage", "Trang Tin tức"),
  "contactPage.hero": PAGE_HERO_BLOCK("contactPage.hero", "contactPage", "Trang Liên hệ"),
};

export const publicCmsTabs = [
  {
    id: "theme",
    label: "Chủ đề",
    description: "Bảng màu và font chung cho toàn site",
    blocks: ["theme.global"],
  },
  {
    id: "home",
    label: "Trang chủ",
    description: "Hero, sections, và CTA của trang chủ",
    blocks: [
      "home.hero",
      "home.style",
      "home.courses",
      "home.teachers",
      "home.testimonials",
      "home.news",
      "home.cta",
      "home.contact",
    ],
  },
  {
    id: "courseStore",
    label: "Khóa học",
    description: "Hero và style trang Khóa học",
    blocks: ["courseStore.hero"],
  },
  {
    id: "teachersPage",
    label: "Giáo viên",
    description: "Hero và style trang Giáo viên",
    blocks: ["teachersPage.hero"],
  },
  {
    id: "newsPage",
    label: "Tin tức",
    description: "Hero và style trang Tin tức",
    blocks: ["newsPage.hero"],
  },
  {
    id: "contactPage",
    label: "Liên hệ",
    description: "Hero và style trang Liên hệ",
    blocks: ["contactPage.hero"],
  },
];

export const getBlock = (id) => publicCmsBlocks[id] || null;
export const getTab = (id) => publicCmsTabs.find((tab) => tab.id === id) || null;
