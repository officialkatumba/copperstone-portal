// const mongoose = require("mongoose");

// const skillSchema = new mongoose.Schema(
//   {
//     code: { type: String, required: true, unique: true },
//     name: { type: String, required: true },
//     description: String,
//     duration: String,
//     category: { type: String, default: "Skill" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Skill", skillSchema);

// models/Skill.js
// const mongoose = require("mongoose");

// const skillSchema = new mongoose.Schema(
//   {
//     code: { type: String, required: true, unique: true },
//     name: { type: String, required: true },
//     description: String,
//     duration: String,
//     category: { type: String, default: "Skill" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Skill", skillSchema);

const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Skill",
    },

    // ⭐ NEW FIELD
    level: {
      type: String,
      default: "Certificate",
    },

    // ⭐ NEW FIELD
    fees: {
      type: Number,
      default: 5000,
    },

    // ⭐ NEW FIELD
    description: {
      type: String,
      default: "Short course offered under skill development.",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
