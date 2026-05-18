const User = require("../models/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "365d";
const REFRESH_JWT_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const REFRESH_COOKIE_MAX_AGE_MS =
  Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) ||
  365 * 24 * 60 * 60 * 1000;
const ACCESS_COOKIE_MAX_AGE_MS =
  Number(process.env.ACCESS_COOKIE_MAX_AGE_MS) || 15 * 60 * 1000;

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

const generateRefreshToken = (id) => {
  if (!REFRESH_JWT_SECRET) {
    throw new Error("Refresh token secret not configured");
  }
  return jwt.sign({ id }, REFRESH_JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
};

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

const setAccessCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
};

exports.signup = asyncHandler(async (req, res) => {
  const { username, password, email, fullName, phone } = req.body;

  if (!username || !password || !phone) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ username, password và số điện thoại",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Mật khẩu phải có ít nhất 6 ký tự",
    });
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
  }

  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      message: "Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số",
    });
  }

  if (await User.findOne({ username })) {
    return res.status(409).json({ message: "Username đã tồn tại" });
  }

  if (email && (await User.findOne({ email }))) {
    return res.status(409).json({ message: "Email đã được sử dụng" });
  }

  if (await User.findOne({ phone })) {
    return res.status(409).json({ message: "Số điện thoại đã được sử dụng" });
  }

  try {
    const user = await User.create({
      username,
      password,
      email,
      fullName,
      phone,
      role: "Parent",
      elo: 100,
    });

    return res.status(201).json({
      message: "Đăng ký thành công",
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Dữ liệu đã tồn tại",
      });
    }
    throw err;
  }
});

exports.signin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập username và password" });
  }

  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!user || !(await user.matchPassword(password))) {
    return res
      .status(401)
      .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.isOnline = true;
  user.lastSeenAt = new Date();
  if (!Number.isFinite(user.elo) || user.elo < 100) {
    user.elo = 100;
  }
  await user.save({ validateBeforeSave: false });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);

  res.json({
    _id: user._id,
    userId: user._id,
    accessToken,
    username: user.username,
    fullName: user.fullName || "",
    role: user.role,
    elo: Number.isFinite(user.elo) ? user.elo : 100,
    linkedStudentId: user.linkedStudentId || null,
  });
});

exports.signout = (req, res) => {
  const markOffline = async () => {
    try {
      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }
      if (!token || !process.env.JWT_SECRET) return;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, {
        isOnline: false,
        lastSeenAt: new Date(),
      });
    } catch {
      // Signout should not fail when token is invalid/expired.
    }
  };

  markOffline();
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.json({ message: "Đăng xuất thành công" });
};

exports.refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!REFRESH_JWT_SECRET) {
    return res.status(500).json({ message: "Server token config missing" });
  }
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Không tìm thấy token trong cookie" });
  }

  jwt.verify(
    refreshToken,
    REFRESH_JWT_SECRET,
    (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      const accessToken = generateAccessToken(decoded.id);
      const nextRefreshToken = generateRefreshToken(decoded.id);
      // Rolling refresh: mỗi lần refresh sẽ gia hạn phiên đăng nhập.
      setAccessCookie(res, accessToken);
      setRefreshCookie(res, nextRefreshToken);
      res.json({ accessToken });
    },
  );
};
