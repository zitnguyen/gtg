import { useState } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "../common/ScrollReveal";
import Spinner from "../common/Spinner";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import { usePublicCms } from "../../context/PublicCmsContext";
import { useTheme } from "../../context/ThemeContext";

const ContactSection = () => {
  const { settings } = useSystemSettings();
  const { cms } = usePublicCms();
  const { isDark } = useTheme();
  const section = cms?.home?.contact || {};
  const theme = cms?.theme || {};
  const badgeStyle = {
    backgroundColor: isDark ? "#FFFFFF" : "#000000",
    color: isDark ? "#000000" : "#FFFFFF",
  };
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    childAge: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [shakeField, setShakeField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ tên";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    setErrors(newErrors);

    // Shake animation for first error field
    const firstError = Object.keys(newErrors)[0];
    if (firstError) {
      setShakeField(firstError);
      setTimeout(() => setShakeField(null), 300);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    alert(
      "Đăng ký thành công! Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất.",
    );
    setFormData({ name: "", phone: "", email: "", childAge: "", message: "" });
  };

  return (
    <section
      className="py-20 bg-background"
      id="contact"
      style={{
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Info */}
          <ScrollReveal direction="left">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={badgeStyle}
            >
              {section?.badge || "Liên hệ"}
            </span>
            <h2
              className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              {section?.title || "Đăng ký học thử"}{" "}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600"
                style={{
                  backgroundImage: section?.highlightColor
                    ? `linear-gradient(to right, ${section.highlightColor}, ${section.highlightColor})`
                    : undefined,
                }}
              >
                {section?.highlightedText || "miễn phí"}
              </span>
            </h2>
            <p
              className="text-muted-foreground mb-8"
            >
              {section?.description ||
                "Điền thông tin bên dưới và chúng tôi sẽ liên hệ bạn trong vòng 24 giờ để sắp xếp buổi học thử cho con."}
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Hotline tư vấn
                  </div>
                  <div className="text-muted-foreground">
                    {settings?.hotline || "0123 456 789"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                  🕐
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Giờ làm việc
                  </div>
                  <div className="text-muted-foreground">
                    {settings?.workingHours || "8:00 - 20:00, Thứ 2 - Chủ nhật"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                  📍
                </div>
                <div>
                  <div className="font-semibold text-foreground">Địa chỉ</div>
                  <div className="text-muted-foreground">
                    {settings?.address || "123 Đường ABC, Quận XYZ, TP.HCM"}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right - Form */}
          <ScrollReveal direction="right">
            <form
              onSubmit={handleSubmit}
              className="bg-card p-8 rounded-2xl border border-border shadow-lg"
            >
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Họ và tên phụ huynh *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      shakeField === "name"
                        ? "animate-shake border-destructive"
                        : "border-input"
                    } ${errors.name ? "border-destructive" : ""}`}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      shakeField === "phone"
                        ? "animate-shake border-destructive"
                        : "border-input"
                    } ${errors.phone ? "border-destructive" : ""}`}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border-input ${errors.email ? "border-destructive" : ""}`}
                    placeholder="Nhập email (không bắt buộc)"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Child Age */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Độ tuổi của con
                  </label>
                  <select
                    name="childAge"
                    value={formData.childAge}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Chọn độ tuổi</option>
                    <option value="4-6">4 - 6 tuổi</option>
                    <option value="7-9">7 - 9 tuổi</option>
                    <option value="10-12">10 - 12 tuổi</option>
                    <option value="13-15">13 - 15 tuổi</option>
                    <option value="16+">Trên 16 tuổi</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Bạn muốn hỏi thêm điều gì?"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-70"
                  style={{
                    borderRadius: theme?.buttonRadius || undefined,
                    backgroundColor: section?.submitButtonBgColor || undefined,
                    color: section?.submitButtonTextColor || undefined,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        size="sm"
                        className="border-primary-foreground border-t-transparent"
                      />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    section?.submitButtonText || "Đăng ký học thử miễn phí"
                  )}
                </motion.button>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
