const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Admin", "Parent", "Student", "Teacher"],
      default: "Parent",
    },
    /** Tài khoản Student đăng nhập — trỏ tới hồ sơ học viên (để đọc ghi danh / tiến độ an toàn). */
    linkedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },
    /** Elo cờ nhanh / đối kháng — khởi điểm 100 (tương tự ý tưởng rating Lichess) */
    elo: {
      type: Number,
      default: 100,
      min: 100,
    },
  },
  {
    timestamps: true,
  },
);

/// 🔐 HASH PASSWORD – CÁCH 1 (KHÔNG next)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (typeof this.password === "string" && this.password.startsWith("$2")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/// 🔑 SO SÁNH PASSWORD
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
