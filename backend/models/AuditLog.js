const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auditLogSchema = new Schema(
  {
    // Action Information
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },

    // User Information
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed by user is required"],
    },

    // Target Information
    targetModel: {
      type: String,
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },

    // Details
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // IP Address
    ipAddress: {
      type: String,
      trim: true,
    },

    // Module/Feature
    module: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to log an action (simplified)
auditLogSchema.statics.logAction = async function (data) {
  try {
    const auditLog = new this({
      action: data.action,
      performedBy: data.performedBy,
      targetModel: data.targetModel,
      targetId: data.targetId,
      details: data.details || {},
      ipAddress: data.ipAddress,
      module: data.module,
    });

    return await auditLog.save();
  } catch (error) {
    console.error("Failed to save audit log:", error);
    return null;
  }
};

// Static method to get recent logs
auditLogSchema.statics.getRecentLogs = async function (limit = 100) {
  return await this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("performedBy", "firstName surname email role");
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
