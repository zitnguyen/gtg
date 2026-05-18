const User = require("./User");
const mongoose = require("mongoose");
const teacherSchema = new mongoose.Schema({
  specialization: String,
  experienceYears: Number,
  certification: String,
  trainingLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
});
const Teacher = User.discriminator("Teacher", teacherSchema);
module.exports = Teacher;
