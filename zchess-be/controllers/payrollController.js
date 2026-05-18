const asyncHandler = require("../middleware/asyncHandler");
const TeachingLog = require("../models/TeachingLog");
const Class = require("../models/Class");
const User = require("../models/User");
const Setting = require("../models/Setting");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const fs = require("fs");
const path = require("path");
const payrollService = require("../modules/payroll/services/payrollService");

const toMinutes = (value) => {
  const [h, m] = String(value || "")
    .split(":")
    .map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const computeDurationHours = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start == null || end == null || end <= start) return null;
  return Number(((end - start) / 60).toFixed(2));
};

const toTeacherSessionDto = (log) => ({
  _id: log._id,
  teacherId: log.teacherId,
  classId: log.classId,
  date: log.date,
  startTime: log.startTime,
  endTime: log.endTime,
  durationHours: log.durationHours,
  salary: log.salary,
  deductionAmount: Number(log.deductionAmount || 0),
  deductionNote: log.deductionNote || "",
  bonusAmount: Number(log.bonusAmount || 0),
  bonusNote: log.bonusNote || "",
  otherCostAmount: Number(log.otherCostAmount || 0),
  otherCostNote: log.otherCostNote || "",
  note: log.note || "",
  status: log.status,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});

const normalizeHeader = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeLookupText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const excelDateToJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseImportDate = (value) => {
  const date = excelDateToJsDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizeTimeText = (value) => {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  const maybeDate = excelDateToJsDate(value);
  if (maybeDate) {
    return `${String(maybeDate.getHours()).padStart(2, "0")}:${String(
      maybeDate.getMinutes(),
    ).padStart(2, "0")}`;
  }
  return raw;
};

const parseSalaryValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(/[, ]/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
};

const parseMonthYear = (month, year) => {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(y) || y < 2000 || y > 3000) return null;
  return { m, y };
};

const sanitizeFilename = (value) =>
  String(value || "Teacher")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

const formatNumberVi = (value) =>
  Number(value || 0).toLocaleString("vi-VN");

const pickFirstExistingPath = (paths = []) =>
  paths.find((candidate) => candidate && fs.existsSync(candidate)) || null;

const resolvePayrollPdfFonts = () => {
  const customRegular = process.env.PAYSLIP_FONT_REGULAR_PATH;
  const customBold = process.env.PAYSLIP_FONT_BOLD_PATH;

  const regularCandidates = [
    customRegular,
    path.resolve(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"),
    path.resolve(process.cwd(), "fonts/NotoSans-Regular.ttf"),
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
  ];
  const boldCandidates = [
    customBold,
    path.resolve(process.cwd(), "assets/fonts/NotoSans-Bold.ttf"),
    path.resolve(process.cwd(), "fonts/NotoSans-Bold.ttf"),
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
  ];

  const regular = pickFirstExistingPath(regularCandidates);
  const bold = pickFirstExistingPath(boldCandidates) || regular;

  return { regular, bold };
};

const resolveLogoLocalPath = (logoUrl) => {
  const raw = String(logoUrl || "").trim();
  if (!raw) return null;
  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw;
  let uploadRelativePath = "";
  if (raw.startsWith("/uploads/")) {
    uploadRelativePath = raw.replace("/uploads/", "");
  } else if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        uploadRelativePath = parsed.pathname.replace("/uploads/", "");
      }
    } catch {
      // ignore URL parse error
    }
  }
  if (uploadRelativePath) {
    const localUploadPath = path.resolve(__dirname, "../uploads", uploadRelativePath);
    if (fs.existsSync(localUploadPath)) return localUploadPath;
  }
  const maybeRelative = path.resolve(process.cwd(), raw.replace(/^\/+/, ""));
  if (fs.existsSync(maybeRelative)) return maybeRelative;
  return null;
};

exports.createTeacherSession = asyncHandler(async (req, res) => {
  const session = await payrollService.createTeacherSession({
    user: req.user,
    body: req.body,
  });
  return res.status(201).json(session);
});

exports.createAdminSession = asyncHandler(async (req, res) => {
  const session = await payrollService.createAdminSession({
    user: req.user,
    body: req.body,
  });
  return res.status(201).json(session);
});

exports.importPayrollExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file Excel để import" });
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return res.status(400).json({ message: "File Excel không có dữ liệu hợp lệ" });
  }

  const headerRow = sheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.value);
    if (key) headerMap[key] = colNumber;
  });

  const pickColumn = (...aliases) => {
    for (const alias of aliases) {
      const found = headerMap[normalizeHeader(alias)];
      if (found) return found;
    }
    return null;
  };

  const teacherIdCol = pickColumn("teacherId");
  const teacherNameCol = pickColumn(
    "teacherName",
    "teacher",
    "giao vien",
    "ten giao vien",
  );
  const classObjectIdCol = pickColumn("classObjectId", "classObjectID", "classMongoId");
  const classCodeCol = pickColumn("classId", "classCode", "ma lop");
  const classNameCol = pickColumn("className", "class", "lop", "ten lop");
  const dateCol = pickColumn("date", "ngay");
  const startCol = pickColumn("startTime", "start", "gio bat dau", "bat dau");
  const endCol = pickColumn("endTime", "end", "gio ket thuc", "ket thuc");
  const salaryCol = pickColumn("salary", "luong");
  const bonusAmountCol = pickColumn("bonusAmount", "bonus", "thuong");
  const bonusNoteCol = pickColumn("bonusNote", "bonusReason", "ghichuthuong");
  const deductionAmountCol = pickColumn(
    "deductionAmount",
    "deduction",
    "penalty",
    "fee",
    "phatphi",
  );
  const deductionNoteCol = pickColumn(
    "deductionNote",
    "deductionReason",
    "penaltyNote",
    "ghichuphatphi",
  );
  const otherCostAmountCol = pickColumn(
    "otherCostAmount",
    "otherCost",
    "chiPhiKhac",
  );
  const otherCostNoteCol = pickColumn(
    "otherCostNote",
    "otherCostReason",
    "ghichuchiphikhac",
  );
  const noteCol = pickColumn("note", "ghi chu");

  if (
    (!teacherIdCol && !teacherNameCol) ||
    (!classObjectIdCol && !classCodeCol && !classNameCol) ||
    !dateCol ||
    !startCol ||
    !endCol
  ) {
    return res.status(400).json({
      message:
        "Thiếu cột bắt buộc. Cần có teacherName (hoặc teacherId), className/classId, date, startTime, endTime",
    });
  }

  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const teacherId = teacherIdCol
      ? String(row.getCell(teacherIdCol).value || "").trim()
      : "";
    const teacherName = teacherNameCol
      ? String(row.getCell(teacherNameCol).value || "").trim()
      : "";
    const classObjectId = classObjectIdCol
      ? String(row.getCell(classObjectIdCol).value || "").trim()
      : "";
    const classCode = classCodeCol
      ? String(row.getCell(classCodeCol).value || "").trim()
      : "";
    const className = classNameCol
      ? String(row.getCell(classNameCol).value || "").trim()
      : "";
    const dateValue = row.getCell(dateCol).value;
    const startTimeRaw = row.getCell(startCol).value;
    const endTimeRaw = row.getCell(endCol).value;
    const salaryValue = salaryCol ? row.getCell(salaryCol).value : null;
    const bonusAmountValue = bonusAmountCol ? row.getCell(bonusAmountCol).value : 0;
    const bonusNoteValue = bonusNoteCol ? row.getCell(bonusNoteCol).value : "";
    const deductionAmountValue = deductionAmountCol
      ? row.getCell(deductionAmountCol).value
      : 0;
    const deductionNoteValue = deductionNoteCol
      ? row.getCell(deductionNoteCol).value
      : "";
    const otherCostAmountValue = otherCostAmountCol
      ? row.getCell(otherCostAmountCol).value
      : 0;
    const otherCostNoteValue = otherCostNoteCol
      ? row.getCell(otherCostNoteCol).value
      : "";
    const noteValue = noteCol ? row.getCell(noteCol).value : "";
    if (
      !teacherId &&
      !teacherName &&
      !classObjectId &&
      !classCode &&
      !className &&
      !dateValue &&
      !startTimeRaw &&
      !endTimeRaw
    ) {
      continue;
    }
    rows.push({
      rowNumber,
      teacherId,
      teacherName,
      classObjectId,
      classCode,
      className,
      dateValue,
      startTime: normalizeTimeText(startTimeRaw),
      endTime: normalizeTimeText(endTimeRaw),
      salaryValue,
      bonusAmountValue,
      bonusNote: String(bonusNoteValue || "").trim(),
      deductionAmountValue,
      deductionNote: String(deductionNoteValue || "").trim(),
      otherCostAmountValue,
      otherCostNote: String(otherCostNoteValue || "").trim(),
      note: String(noteValue || "").trim(),
    });
  }

  if (rows.length === 0) {
    return res.status(400).json({ message: "Không có dòng dữ liệu để import" });
  }

  const allTeachers = await User.find({ role: "Teacher" }).select(
    "_id fullName username",
  );
  const teacherById = new Map(allTeachers.map((t) => [String(t._id), t]));
  const teacherByName = new Map();
  allTeachers.forEach((t) => {
    const aliases = [
      normalizeLookupText(t.fullName),
      normalizeLookupText(t.username),
    ].filter(Boolean);
    aliases.forEach((alias) => {
      const existed = teacherByName.get(alias) || [];
      existed.push(String(t._id));
      teacherByName.set(alias, existed);
    });
  });

  const allClasses = await Class.find({}).select("_id classId className teacherId");
  const classByObjectId = new Map(allClasses.map((c) => [String(c._id), c]));
  const classByCode = new Map();
  const classByName = new Map();
  allClasses.forEach((c) => {
    if (c.classId) classByCode.set(String(c.classId).trim(), c);
    const key = normalizeLookupText(c.className);
    const existed = classByName.get(key) || [];
    existed.push(c);
    classByName.set(key, existed);
  });

  const errors = [];
  const payloads = [];
  rows.forEach((item) => {
    let resolvedTeacherId = "";
    if (item.teacherId) {
      if (!teacherById.has(item.teacherId)) {
        errors.push(`Dòng ${item.rowNumber}: teacherId không hợp lệ`);
        return;
      }
      resolvedTeacherId = item.teacherId;
    } else {
      const matchedTeacherIds =
        teacherByName.get(normalizeLookupText(item.teacherName)) || [];
      if (matchedTeacherIds.length === 0) {
        errors.push(`Dòng ${item.rowNumber}: không tìm thấy giáo viên "${item.teacherName}"`);
        return;
      }
      if (matchedTeacherIds.length > 1) {
        errors.push(`Dòng ${item.rowNumber}: tên giáo viên bị trùng, vui lòng nhập teacherId`);
        return;
      }
      resolvedTeacherId = matchedTeacherIds[0];
    }

    let classDoc = null;
    if (item.classObjectId) {
      classDoc = classByObjectId.get(item.classObjectId) || null;
    } else if (item.classCode) {
      classDoc = classByCode.get(item.classCode) || null;
    } else {
      const matchedClasses = classByName.get(normalizeLookupText(item.className)) || [];
      if (matchedClasses.length > 1) {
        errors.push(`Dòng ${item.rowNumber}: tên lớp bị trùng, vui lòng nhập classId`);
        return;
      }
      classDoc = matchedClasses[0] || null;
    }
    if (!classDoc) {
      errors.push(`Dòng ${item.rowNumber}: không tìm thấy lớp học`);
      return;
    }
    if (String(classDoc.teacherId) !== resolvedTeacherId) {
      errors.push(`Dòng ${item.rowNumber}: class không thuộc teacher`);
      return;
    }
    const date = parseImportDate(item.dateValue);
    if (!date) {
      errors.push(`Dòng ${item.rowNumber}: date không hợp lệ`);
      return;
    }
    const durationHours = computeDurationHours(item.startTime, item.endTime);
    if (!durationHours || durationHours <= 0) {
      errors.push(`Dòng ${item.rowNumber}: startTime/endTime không hợp lệ`);
      return;
    }
    const salary = parseSalaryValue(item.salaryValue);
    if (salary !== null && (!Number.isFinite(salary) || salary < 0)) {
      errors.push(`Dòng ${item.rowNumber}: salary không hợp lệ`);
      return;
    }
    const deductionAmount = Number(
      item.deductionAmountValue === "" || item.deductionAmountValue == null
        ? 0
        : item.deductionAmountValue,
    );
    if (!Number.isFinite(deductionAmount) || deductionAmount < 0) {
      errors.push(`Dòng ${item.rowNumber}: deductionAmount không hợp lệ`);
      return;
    }
    const bonusAmount = Number(
      item.bonusAmountValue === "" || item.bonusAmountValue == null
        ? 0
        : item.bonusAmountValue,
    );
    if (!Number.isFinite(bonusAmount) || bonusAmount < 0) {
      errors.push(`Dòng ${item.rowNumber}: bonusAmount không hợp lệ`);
      return;
    }
    const otherCostAmount = Number(
      item.otherCostAmountValue === "" || item.otherCostAmountValue == null
        ? 0
        : item.otherCostAmountValue,
    );
    if (!Number.isFinite(otherCostAmount) || otherCostAmount < 0) {
      errors.push(`Dòng ${item.rowNumber}: otherCostAmount không hợp lệ`);
      return;
    }
    payloads.push({
      teacherId: resolvedTeacherId,
      classId: String(classDoc._id),
      date,
      startTime: item.startTime,
      endTime: item.endTime,
      durationHours,
      salary,
      bonusAmount,
      bonusNote: item.bonusNote,
      deductionAmount,
      deductionNote: item.deductionNote,
      otherCostAmount,
      otherCostNote: item.otherCostNote,
      note: item.note,
      status: salary == null ? "Pending" : "Confirmed",
      createdBy: req.user._id,
    });
  });

  if (errors.length) {
    return res.status(400).json({
      message: "Import thất bại do dữ liệu không hợp lệ",
      errors: errors.slice(0, 20),
    });
  }

  const inserted = await TeachingLog.insertMany(payloads, { ordered: true });
  return res.status(201).json({
    message: `Import thành công ${inserted.length} ca dạy`,
    insertedCount: inserted.length,
  });
});

exports.downloadPayrollImportTemplate = asyncHandler(async (_req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("PayrollImportTemplate");
  const headers = [
    "teacherName",
    "className",
    "date",
    "startTime",
    "endTime",
    "salary",
    "bonusAmount",
    "bonusNote",
    "deductionAmount",
    "deductionNote",
    "otherCostAmount",
    "otherCostNote",
    "note",
  ];
  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: header === "note" ? 30 : 18,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  sheet.addRow({
    teacherName: "Nguyen Van A",
    className: "Lop Co Vua Co Ban",
    date: "2026-05-07",
    startTime: "18:00",
    endTime: "19:30",
    salary: 250000,
    bonusAmount: 30000,
    bonusNote: "Dat KPI",
    deductionAmount: 20000,
    deductionNote: "Di muon",
    otherCostAmount: 10000,
    otherCostNote: "In tai lieu",
    note: "Ca dạy mẫu để import",
  });

  sheet.getCell("C2").numFmt = "yyyy-mm-dd";
  sheet.getCell("F2").numFmt = "#,##0";
  sheet.getCell("G2").numFmt = "#,##0";
  sheet.getCell("I2").numFmt = "#,##0";

  const help = workbook.addWorksheet("Guide");
  help.getCell("A1").value = "Hướng dẫn import bảng lương";
  help.getCell("A1").font = { bold: true, size: 13 };
  help.getCell("A3").value =
    "1) Không đổi tên cột ở sheet PayrollImportTemplate.";
  help.getCell("A4").value =
    "2) Dùng teacherName + className (không cần nhập ObjectId).";
  help.getCell("A5").value =
    "3) Nếu tên bị trùng nhiều bản ghi, có thể dùng teacherId/classId để phân biệt.";
  help.getCell("A6").value =
    "4) date dùng định dạng yyyy-mm-dd, time dùng HH:mm (24h).";
  help.getCell("A7").value =
    "5) salary để trống nếu chưa chốt lương cho ca dạy.";
  help.getCell("A8").value =
    "6) bonusAmount, deductionAmount, otherCostAmount có thể để 0.";
  help.getColumn("A").width = 90;

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Payroll_Import_Template.xlsx"',
  );
  return res.send(Buffer.from(buffer));
});

exports.getTeacherSessions = asyncHandler(async (req, res) => {
  const sessions = await payrollService.getTeacherSessions(req.user);
  return res.json(sessions);
});

exports.getAdminPayroll = asyncHandler(async (req, res) => {
  const rows = await payrollService.getAdminPayroll();
  return res.json(rows);
});

exports.getAdminPayrollByTeacher = asyncHandler(async (req, res) => {
  const detail = await payrollService.getAdminPayrollByTeacher(
    req.params.teacherId,
  );
  return res.json(detail);
});

exports.updateSessionSalary = asyncHandler(async (req, res) => {
  const session = await payrollService.updateSessionSalary({
    sessionId: req.params.id,
    salary: req.body.salary,
  });
  return res.json(session);
});

exports.updateSessionCompensation = asyncHandler(async (req, res) => {
  const session = await payrollService.updateSessionCompensation({
    sessionId: req.params.id,
    body: req.body,
  });
  return res.json(session);
});

exports.deleteSession = asyncHandler(async (req, res) => {
  const result = await payrollService.deleteSession(req.params.id);
  return res.json(result);
});

exports.resetSessionSalary = asyncHandler(async (req, res) => {
  const session = await payrollService.resetSessionSalary(req.params.id);
  return res.json(session);
});

exports.getPayrollSummary = asyncHandler(async (req, res) => {
  const summary = await payrollService.getPayrollSummary();
  return res.json(summary);
});

exports.exportPayslip = asyncHandler(async (req, res) => {
  const { teacherId, month, year, type = "excel" } = req.query;
  if (!teacherId || !month || !year) {
    return res
      .status(400)
      .json({ message: "Thiếu teacherId, month hoặc year" });
  }

  const parsed = parseMonthYear(month, year);
  if (!parsed) {
    return res.status(400).json({ message: "month/year không hợp lệ" });
  }
  const normalizedType = String(type).toLowerCase();
  if (!["excel", "pdf"].includes(normalizedType)) {
    return res.status(400).json({ message: "type phải là excel hoặc pdf" });
  }

  const teacher = await User.findOne({
    _id: teacherId,
    role: "Teacher",
  }).select("_id fullName username");
  if (!teacher) {
    return res.status(404).json({ message: "Không tìm thấy giáo viên" });
  }

  const from = new Date(parsed.y, parsed.m - 1, 1, 0, 0, 0, 0);
  const to = new Date(parsed.y, parsed.m, 0, 23, 59, 59, 999);

  const sessions = await TeachingLog.find({
    teacherId,
    date: { $gte: from, $lte: to },
  })
    .populate("classId", "className")
    .sort({ date: 1, startTime: 1 });

  const salarySessions = sessions.filter(
    (item) => item.salary !== null && item.salary !== undefined,
  );
  if (salarySessions.length === 0) {
    return res.status(400).json({
      message: "Không thể xuất phiếu lương khi chưa có salary cho tháng này",
    });
  }

  const totalSessions = salarySessions.length;
  const totalHours = Number(
    salarySessions
      .reduce((sum, item) => sum + (Number(item.durationHours) || 0), 0)
      .toFixed(2),
  );
  const totalSalary = salarySessions.reduce(
    (sum, item) => sum + (Number(item.salary) || 0),
    0,
  );
  const totalDeductions = salarySessions.reduce(
    (sum, item) => sum + (Number(item.deductionAmount) || 0),
    0,
  );
  const totalBonuses = salarySessions.reduce(
    (sum, item) => sum + (Number(item.bonusAmount) || 0),
    0,
  );
  const totalOtherCosts = salarySessions.reduce(
    (sum, item) => sum + (Number(item.otherCostAmount) || 0),
    0,
  );
  const totalNetSalary =
    totalSalary + totalBonuses - totalDeductions - totalOtherCosts;

  const teacherName = teacher.fullName || teacher.username || "Teacher";
  const generatedBy = req.user?.fullName || req.user?.username || "Admin";
  const generatedAt = new Date();
  const baseFile = `Payslip_${sanitizeFilename(teacherName)}_${parsed.m}_${parsed.y}`;
  const settings = await Setting.findOne({ singletonKey: "system" }).select(
    "centerName logoUrl",
  );
  const centerName = settings?.centerName || "TRUNG TÂM Z CHESS";
  const logoPath =
    resolveLogoLocalPath(settings?.logoUrl) ||
    pickFirstExistingPath([
      process.env.PAYSLIP_LOGO_PATH,
      path.resolve(process.cwd(), "assets/logo.png"),
      path.resolve(process.cwd(), "assets/logo.jpg"),
      path.resolve(process.cwd(), "assets/logo.jpeg"),
    ]);

  if (normalizedType === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payslip");

    sheet.columns = [
      { header: "Ngày", key: "date", width: 14 },
      { header: "Tên lớp", key: "className", width: 24 },
      { header: "Giờ bắt đầu", key: "startTime", width: 12 },
      { header: "Giờ kết thúc", key: "endTime", width: 12 },
      { header: "Tổng giờ", key: "durationHours", width: 12 },
      { header: "Lương/ca", key: "salary", width: 14 },
      { header: "Thưởng", key: "bonusAmount", width: 12 },
      { header: "Phạt", key: "deductionAmount", width: 12 },
      { header: "Chi phí khác", key: "otherCostAmount", width: 14 },
      { header: "Thực nhận", key: "netSalary", width: 14 },
    ];

    if (logoPath) {
      const extension = path.extname(logoPath).toLowerCase().includes("png")
        ? "png"
        : "jpeg";
      const imageId = workbook.addImage({
        filename: logoPath,
        extension,
      });
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 72, height: 72 },
      });
    }

    sheet.mergeCells("A1:J1");
    sheet.getCell("A1").value = centerName.toUpperCase();
    sheet.getCell("A1").font = { bold: true, size: 16 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells("A2:J2");
    sheet.getCell("A2").value = `PHIẾU LƯƠNG - ${parsed.m}/${parsed.y}`;
    sheet.getCell("A2").font = { bold: true, size: 13 };
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.getCell("A4").value = "Giáo viên";
    sheet.getCell("B4").value = teacherName;
    sheet.getCell("D4").value = "Ngày tạo";
    sheet.getCell("E4").value = generatedAt.toLocaleString("vi-VN");

    sheet.getCell("A5").value = "Người tạo";
    sheet.getCell("B5").value = generatedBy;

    const tableHeaderRow = 7;
    const headers = [
      "Ngày",
      "Tên lớp",
      "Giờ bắt đầu",
      "Giờ kết thúc",
      "Tổng giờ",
      "Lương/ca",
      "Thưởng",
      "Phạt",
      "Chi phí khác",
      "Thực nhận",
    ];
    headers.forEach((label, idx) => {
      const cell = sheet.getCell(tableHeaderRow, idx + 1);
      cell.value = label;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    salarySessions.forEach((item, index) => {
      const row = sheet.getRow(tableHeaderRow + 1 + index);
      row.getCell(1).value = new Date(item.date).toLocaleDateString("vi-VN");
      row.getCell(2).value = item.classId?.className || "";
      row.getCell(3).value = item.startTime || "";
      row.getCell(4).value = item.endTime || "";
      row.getCell(5).value = Number(item.durationHours || 0);
      const salary = Number(item.salary || 0);
      const bonus = Number(item.bonusAmount || 0);
      const deduction = Number(item.deductionAmount || 0);
      const otherCost = Number(item.otherCostAmount || 0);
      row.getCell(6).value = salary;
      row.getCell(7).value = bonus;
      row.getCell(8).value = deduction;
      row.getCell(9).value = otherCost;
      row.getCell(10).value = salary + bonus - deduction - otherCost;
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((col) => {
        row.getCell(col).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const summaryStart = tableHeaderRow + 2 + salarySessions.length;
    sheet.getCell(`A${summaryStart}`).value = "Tổng số ca";
    sheet.getCell(`B${summaryStart}`).value = totalSessions;
    sheet.getCell(`A${summaryStart + 1}`).value = "Tổng số giờ";
    sheet.getCell(`B${summaryStart + 1}`).value = totalHours;
    sheet.getCell(`A${summaryStart + 2}`).value = "Tổng số lương";
    sheet.getCell(`B${summaryStart + 2}`).value = formatNumberVi(totalSalary);
    sheet.getCell(`A${summaryStart + 3}`).value = "Tổng thưởng";
    sheet.getCell(`B${summaryStart + 3}`).value = formatNumberVi(totalBonuses);
    sheet.getCell(`A${summaryStart + 4}`).value = "Tổng phạt";
    sheet.getCell(`B${summaryStart + 4}`).value = formatNumberVi(totalDeductions);
    sheet.getCell(`A${summaryStart + 5}`).value = "Tổng chi phí khác";
    sheet.getCell(`B${summaryStart + 5}`).value = formatNumberVi(totalOtherCosts);
    sheet.getCell(`A${summaryStart + 6}`).value = "Lương thực nhận";
    sheet.getCell(`B${summaryStart + 6}`).value = formatNumberVi(totalNetSalary);
    sheet.getCell(`A${summaryStart + 6}`).font = { bold: true };
    sheet.getCell(`B${summaryStart + 6}`).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseFile}.xlsx"`,
    );
    return res.send(Buffer.from(buffer));
  }

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const fonts = resolvePayrollPdfFonts();
  const stream = new PassThrough();
  const chunks = [];

  stream.on("data", (chunk) => chunks.push(chunk));
  stream.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseFile}.pdf"`,
    );
    res.send(pdfBuffer);
  });

  doc.pipe(stream);
  const useUnicodeFonts = Boolean(fonts.regular && fonts.bold);
  if (useUnicodeFonts) {
    doc.registerFont("PayrollRegular", fonts.regular);
    doc.registerFont("PayrollBold", fonts.bold);
  }
  const setRegularFont = () =>
    doc.font(useUnicodeFonts ? "PayrollRegular" : "Helvetica");
  const setBoldFont = () =>
    doc.font(useUnicodeFonts ? "PayrollBold" : "Helvetica-Bold");

  if (logoPath) {
    try {
      doc.image(logoPath, 40, 36, { fit: [54, 54] });
    } catch {
      // Ignore logo draw failure, keep exporting text content.
    }
  }

  setBoldFont();
  doc.fontSize(16).text(centerName.toUpperCase(), { align: "center" });
  doc.moveDown(0.3);
  doc
    .fontSize(13)
    .text(`PHIẾU LƯƠNG - ${parsed.m}/${parsed.y}`, { align: "center" });
  doc.moveDown();
  setRegularFont();
  doc.fontSize(10).text(`Giáo viên: ${teacherName}`);
  doc.text(`Người tạo: ${generatedBy}`);
  doc.text(`Ngày tạo: ${generatedAt.toLocaleString("vi-VN")}`);
  doc.moveDown();

  const tableTop = doc.y;
  const colX = [30, 78, 172, 222, 272, 318, 368, 418, 468, 522];
  setBoldFont();
  doc.fontSize(10);
  [
    "Ngày",
    "Tên lớp",
    "Giờ bắt đầu",
    "Giờ kết thúc",
    "Tổng giờ",
    "Lương",
    "Thưởng",
    "Phạt",
    "CP khác",
    "Thực nhận",
  ].forEach((h, idx) => {
    const widths = [46, 90, 48, 48, 44, 48, 48, 48, 50, 50];
    doc.text(h, colX[idx], tableTop, { width: widths[idx] });
  });
  doc
    .moveTo(40, tableTop + 15)
    .lineTo(570, tableTop + 15)
    .stroke();

  setRegularFont();
  let y = tableTop + 20;
  salarySessions.forEach((item) => {
    if (y > 740) {
      doc.addPage();
      y = 60;
    }
    doc.text(new Date(item.date).toLocaleDateString("vi-VN"), colX[0], y, {
      width: 55,
    });
    doc.text(item.classId?.className || "", colX[1], y, { width: 130 });
    const salary = Number(item.salary || 0);
    const bonus = Number(item.bonusAmount || 0);
    const deduction = Number(item.deductionAmount || 0);
    const otherCost = Number(item.otherCostAmount || 0);
    const net = salary + bonus - deduction - otherCost;
    doc.text(item.startTime || "", colX[2], y, { width: 46 });
    doc.text(item.endTime || "", colX[3], y, { width: 46 });
    doc.text(String(item.durationHours || 0), colX[4], y, { width: 42 });
    doc.text(formatNumberVi(salary), colX[5], y, { width: 46 });
    doc.text(formatNumberVi(bonus), colX[6], y, { width: 46 });
    doc.text(formatNumberVi(deduction), colX[7], y, { width: 46 });
    doc.text(formatNumberVi(otherCost), colX[8], y, { width: 48 });
    doc.text(formatNumberVi(net), colX[9], y, { width: 50 });
    y += 18;
  });

  doc.moveDown();
  setBoldFont();
  doc.text(`Tổng số ca: ${totalSessions}`);
  doc.text(`Tổng số giờ: ${totalHours}`);
  doc.text(`Tổng số lương: ${formatNumberVi(totalSalary)}`);
  doc.text(`Tổng thưởng: ${formatNumberVi(totalBonuses)}`);
  doc.text(`Tổng phạt: ${formatNumberVi(totalDeductions)}`);
  doc.text(`Tổng chi phí khác: ${formatNumberVi(totalOtherCosts)}`);
  doc.text(`Lương thực nhận: ${formatNumberVi(totalNetSalary)}`);

  doc.end();
});
