const mongoose = require("mongoose");
require("dotenv").config();

const Skill = require("./models/Skill");

const seedSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected (Skill Seeding)");

    const skills = [
      {
        name: "Electrical Engineering (Basic/Artisan Level)",
        duration: "3 Months",
      },
      { name: "Plumbing & Pipefitting", duration: "3 Months" },
      { name: "Automotive Mechanics", duration: "3 Months" },
      { name: "Welding (SMAW + Fabrication Basics)", duration: "3 Months" },
      { name: "Carpentry & Joinery", duration: "3 Months" },
      { name: "Natural Resource Management (Basic)", duration: "1–2 Months" },
      { name: "Metal Fabrication", duration: "3 Months" },
      { name: "Project Management (Short Course)", duration: "4–6 Weeks" },
      { name: "Beekeeping", duration: "4–6 Weeks" },
      { name: "Bricklaying (Basic Masonry)", duration: "3 Months" },
      { name: "Heavy Equipment Repair (Basic)", duration: "3–4 Months" },
      { name: "Fluid Coupling Alignment", duration: "2–4 Weeks" },
      {
        name: "Hospitality (Food Production, Housekeeping, Front Office)",
        duration: "2–3 Months",
      },
      {
        name: "ICT – Computer Applications / Certificates",
        duration: "1–3 Months",
      },
      { name: "Gearbox Maintenance", duration: "4–8 Weeks" },
      { name: "Occupational Health & Safety (OSHE)", duration: "4–8 Weeks" },
      { name: "Auto-Electrical", duration: "3 Months" },
      { name: "Entrepreneurship Development", duration: "4 Weeks" },
      { name: "Leadership & Emotional Intelligence", duration: "2–4 Weeks" },
      { name: "Mining (Basic Mine Operations)", duration: "2–3 Months" },
      { name: "Tailoring & Design", duration: "3 Months" },
      { name: "Basic Mine Safety & Health", duration: "5 Days" },
      {
        name: "Occupational Health & Safety (OHS) Level 1",
        duration: "10 Days",
      },
      {
        name: "Mine Blasting Assistant / Explosives Handling",
        duration: "3 Weeks",
      },
      {
        name: "Mining Equipment Operation (Forklift, Excavator, Loader)",
        duration: "1 Month",
      },
      { name: "Mine Surveying Basics", duration: "2 Weeks" },
      {
        name: "Drilling Operations (Rotary & Percussion)",
        duration: "3 Weeks",
      },
      { name: "Underground Mining Operations", duration: "1 Month" },
      { name: "Surface Mining Operations", duration: "3 Weeks" },
      { name: "Mineral Processing Basics", duration: "3 Weeks" },
      { name: "Mine Laboratory Technician Skills", duration: "3 Weeks" },
      { name: "Mine Ventilation & Gas Control", duration: "10 Days" },
      { name: "Rock Mechanics & Ground Control", duration: "2 Weeks" },
      { name: "Mine Environmental Management", duration: "10 Days" },
      { name: "Mine Electrical Assistant", duration: "1 Month" },
      { name: "Mine Mechanical Fitting & Maintenance", duration: "1 Month" },
    ];

    // Create codes like SKL001...
    const generateCode = (i) => "SKL" + String(i + 1).padStart(3, "0");

    let added = 0;

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];

      const exists = await Skill.findOne({ name: skill.name });

      if (exists) {
        console.log(`⏭️ Skipped (exists): ${skill.name}`);
        continue;
      }

      await Skill.create({
        code: generateCode(i),
        name: skill.name,
        duration: skill.duration,
        category: "Skill",
      });

      console.log(`✅ Added Skill: ${skill.name}`);
      added++;
    }

    console.log(`\n🎉 Skill Seeding Complete — ${added} skills added.`);
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedSkills();
