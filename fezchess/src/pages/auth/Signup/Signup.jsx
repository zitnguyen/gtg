import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../../services/authService";
import { User, Lock, Mail, Phone, ArrowRight, Loader } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const { username, fullName, email, password, confirmPassword, phone } =
      formData;

    // validate
    if (
      !username ||
      !fullName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone
    ) {
      setMessage("Vui lòng nhập đầy đủ tất cả thông tin");
      setMessageType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Email không hợp lệ");
      setMessageType("error");
      return;
    }

    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
      setMessage("Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Mật khẩu nhập lại không khớp");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username,
        fullName,
        email,
        password,
        phone,
      });

      setMessage("Đăng ký thành công! Chuyển sang trang đăng nhập...");
      setMessageType("success");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || "Đăng ký thất bại");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-6">Đăng ký</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-300"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Tên đăng nhập"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
          <input
            name="fullName"
            placeholder="Họ và tên"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
          <input
            name="phone"
            placeholder="Số điện thoại"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-xl hover:bg-black/90 flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader className="animate-spin" /> : <ArrowRight />}
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
