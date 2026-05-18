import React from "react";
import { Link } from "react-router-dom";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import { toast } from "sonner";
import leadService from "../../services/leadService";

const Footer = () => {
  const { settings } = useSystemSettings();
  const [phone, setPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const normalized = String(phone || "").trim();
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(normalized)) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    try {
      setSubmitting(true);
      await leadService.create({
        name: "Newsletter subscriber",
        phone: normalized,
        message: "Đăng ký nhận tin từ footer",
      });
      toast.success("Đăng ký nhận tin thành công");
      setPhone("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#f5f5f5] text-black pt-12 pb-8 border-t border-[#ececec]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Center logo"
                  className="w-10 h-10 rounded-lg object-cover border border-[#e5e7eb]"
                />
              ) : (
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white">♔</span>
                </div>
              )}
              <div>
                <h3 className="font-display text-lg font-bold">
                  {settings?.centerName || "Z Chess"}
                </h3>
                <p className="text-xs text-gray-500">
                  Trung tâm Cờ Vua
                </p>
              </div>
            </div>
            <p className="leading-relaxed text-sm text-gray-600">
              Nơi phát triển tư duy, bản lĩnh cho thế hệ trẻ.
            </p>
          </div>

          {/* Quick Links */}
          <div className="xl:col-span-1">
            <h4 className="font-display text-lg font-semibold mb-6">
              Liên kết nhanh
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Trang chủ", to: "/" },
                {
                  label: "Giới thiệu trung tâm",
                  to: "/",
                  hash: "club-intro",
                },
                { label: "Khóa học", to: "/courses" },
                { label: "Giáo viên", to: "/teachers" },
                { label: "Liên hệ", to: "/contact" },
                /* Task: Footer — luyện cờ (tham khảo lichess.org) — DucManh-BlueOC */
                { label: "Câu đố & luyện", to: "/training" },
                { label: "Đối kháng online", to: "/play/live" },
                { label: "Phân tích bàn cờ", to: "/analysis" },
                { label: "Câu đố mỗi ngày", to: "/training/daily" },
                { label: "Puzzle Rush", to: "/training/puzzle-rush" },
              ].map((item) => (
                <li key={item.hash ? `${item.label}-${item.hash}` : item.to}>
                  <Link
                    to={
                      item.hash
                        ? { pathname: item.to, hash: item.hash }
                        : item.to
                    }
                    className="text-gray-600 hover:text-black transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Task: Trang liên quan — cột như covuadaisy.com */}
          {/* Author: DucManh-BlueOC */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">
              Trang liên quan
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Học trực tuyến", to: "/courses" },
                { label: "Khóa học Online", to: "/courses" },
                {
                  label: "Thông tin CLB",
                  to: "/",
                  hash: "club-intro",
                },
                { label: "Bài viết", to: "/news" },
                { label: "Hồ sơ cá nhân", to: "/login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={
                      item.hash
                        ? { pathname: item.to, hash: item.hash }
                        : item.to
                    }
                    className="text-gray-600 hover:text-black transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">
              Liên hệ
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-600">
                <PhoneIcon className="w-5 h-5 text-black" />
                <span>{settings?.hotline || "0934 830 045"}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <EnvelopeIcon className="w-5 h-5 text-black" />
                <span>{settings?.email || "zchessvn@gmail.com"}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <MapPinIcon className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                <span>
                  {settings?.address ||
                    "1181/26 KDC Lê Văn Lương, xã Nhà Bè, TP. Hồ Chí Minh"}
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <span className="w-5 h-5 text-black font-bold">⏰</span>
                <span>{settings?.workingHours || "08:00 - 20:00"}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">
              Đăng ký nhận tin
            </h4>
            <p className="text-gray-600 mb-4 text-sm">
              Nhận thông tin khóa học mới và ưu đãi đặc biệt
            </p>
            <form className="space-y-3" onSubmit={handleSubscribe}>
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white border border-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-black/10"
                disabled={submitting}
              />
              <button type="submit" className="bg-black text-white w-full py-2 rounded-lg font-medium disabled:opacity-70" disabled={submitting}>
                {submitting ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-[#e4e4e4]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-gray-500 text-sm px-1">
              © 2024 Z Chess. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              <Link
                to="/privacy-policy"
                className="text-gray-500 hover:text-black transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link
                to="/terms-of-use"
                className="text-gray-500 hover:text-black transition-colors"
              >
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
