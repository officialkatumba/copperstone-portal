// backend/removeOldSkills.js
const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("./models/Course");

const removeOldSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await Course.deleteMany({ category: "Skill" });

    console.log(`🗑️ Removed ${result.deletedCount} old 'Skill' courses.`);
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

removeOldSkills();
