const mongoose = require("mongoose");

const groupAssignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin/Registrar
    status: {
      type: String,
      enum: ["Enrolled", "Active", "Completed"],
      default: "Enrolled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupAssignment", groupAssignmentSchema);
