import React, { useState } from "react";
import inquiryService from "../../services/inquiryService";
import { Phone, Mail, Send, CheckCircle, ShieldCheck } from "lucide-react";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import { usePublicCms } from "../../context/PublicCmsContext";

const ContactPage = () => {
  const { settings } = useSystemSettings();
  const { cms } = usePublicCms();
  const page = cms?.contactPage || {};
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    type: "General",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inquiryService.create(formData);
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        type: "General",
      });
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert(error?.apiMessage || "Gửi liên hệ thất bại. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-[#f3f4f6]"
      style={{
        fontFamily:
          page?.fontFamily && page.fontFamily !== "inherit"
            ? page.fontFamily
            : undefined,
      }}
    >
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-8">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1 text-xs font-semibold tracking-wide">
              LIÊN HỆ
            </span>

            <h1
              className="mt-5 text-4xl md:text-6xl leading-tight font-bold text-gray-900"
              style={{ fontSize: page?.titleFontSize || undefined }}
            >
              Bắt đầu hành trình <span className="text-blue-700">Cờ Vua</span>{" "}
              của bạn.
            </h1>

            <p
              className="mt-5 text-base md:text-lg text-gray-600 max-w-[46ch]"
              style={{ fontSize: page?.descriptionFontSize || undefined }}
            >
              {page?.description ||
                "Bạn có câu hỏi về lộ trình học, lớp kèm riêng hoặc các giải đấu sắp tới? Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn."}
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-gray-300 bg-white p-4">
                <div className="p-2.5 rounded-lg bg-gray-100 text-gray-900">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </p>
                  <p className="font-semibold text-gray-900 break-words">
                    {settings?.email || "zchessvn@gmail.com"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-gray-300 bg-white p-4">
                <div className="p-2.5 rounded-lg bg-gray-100 text-gray-900">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Điện thoại
                  </p>
                  <p className="font-semibold text-gray-900">
                    {settings?.hotline || "0934 830 045"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-300 bg-white">
              <img
                src="https://images.unsplash.com/photo-1528819622765-d6bcf132f793?q=80&w=1200&auto=format&fit=crop"
                alt="Chess pieces"
                className="h-52 md:h-60 w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>

            {success ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Đã gửi thành công!
                </h3>
                <p className="text-gray-600 mb-6">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                    Nhu cầu
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="General">Tư vấn chung</option>
                    <option value="Trial">Đăng ký học thử</option>
                    <option value="Consultation">
                      Tư vấn khóa học chuyên sâu
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
                    Lời nhắn
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 h-32"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Bạn cần hỗ trợ gì thêm không?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-black/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{
                    backgroundColor: page?.buttonColor || undefined,
                    color: page?.buttonTextColor || undefined,
                  }}
                >
                  {loading ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center text-sm">
              <div className="inline-flex items-center gap-2 text-gray-600 text-center">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Dữ liệu của bạn được bảo mật và an toàn</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
