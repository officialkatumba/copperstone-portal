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
const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    duration: String,
    category: { type: String, default: "Skill" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
