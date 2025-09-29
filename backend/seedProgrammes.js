// backend/seed.js
const mongoose = require("mongoose");
require("dotenv").config();

const Programme = require("./models/Programme");

const seedData = async () => {
  try {
    // ✅ Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected for seeding");

    // Clear old data
    await Programme.deleteMany({});

    // Seed Programmes
    const programmes = await Programme.insertMany([
      // ---------------- Certificate ----------------
      {
        name: "Certificate in Fire Safety",
        code: "CERT-FS01",
        description:
          "Covers fire prevention, emergency response, and safety compliance.",
        durationYears: 1,
        tuitionFee: 2000,
        level: "Certificate",
      },
      {
        name: "Certificate in Occupational Health & Safety",
        code: "CERT-OHS01",
        description:
          "Introduces workplace health, safety, and environmental standards.",
        durationYears: 1,
        tuitionFee: 2200,
        level: "Certificate",
      },
      {
        name: "Certificate in Computer Applications",
        code: "CERT-CA01",
        description:
          "Basic IT literacy including Microsoft Office, email, and digital skills.",
        durationYears: 1,
        tuitionFee: 1800,
        level: "Certificate",
      },

      // ---------------- Diploma ----------------
      {
        name: "Diploma in Computer Science",
        code: "DIP-CS01",
        description:
          "Covers programming, databases, and networking with practical labs.",
        durationYears: 2,
        tuitionFee: 4500,
        level: "Diploma",
      },
      {
        name: "Diploma in Business Administration",
        code: "DIP-BA01",
        description:
          "Focuses on accounting, management, marketing, and entrepreneurship.",
        durationYears: 2,
        tuitionFee: 4800,
        level: "Diploma",
      },
      {
        name: "Diploma in Environmental Health",
        code: "DIP-EH01",
        description:
          "Addresses sanitation, food safety, public health, and disease prevention.",
        durationYears: 2,
        tuitionFee: 5000,
        level: "Diploma",
      },
      {
        name: "Diploma in Education",
        code: "DIP-EDU01",
        description:
          "Prepares students to become professional teachers at primary/secondary levels.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },

      // ---------------- Bachelor ----------------
      {
        name: "Bachelor of Computer Science",
        code: "BSC-CS01",
        description:
          "Advanced study in software engineering, AI, data science, and networking.",
        durationYears: 4,
        tuitionFee: 9500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Business Administration",
        code: "BBA01",
        description:
          "Covers leadership, strategic management, finance, and operations.",
        durationYears: 4,
        tuitionFee: 9000,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Environmental Science",
        code: "BSC-ENV01",
        description:
          "Focuses on ecology, conservation, sustainability, and climate change.",
        durationYears: 4,
        tuitionFee: 9200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Public Health",
        code: "BPH01",
        description:
          "Explores epidemiology, healthcare systems, and health promotion.",
        durationYears: 4,
        tuitionFee: 9500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Education (Secondary)",
        code: "BED-SEC01",
        description:
          "Trains teachers for secondary school teaching in major subject areas.",
        durationYears: 4,
        tuitionFee: 8800,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Laws (LLB)",
        code: "LLB01",
        description:
          "Undergraduate law degree covering legal systems, human rights, and practice.",
        durationYears: 4,
        tuitionFee: 10000,
        level: "Bachelor",
      },

      // ---------------- Masters ----------------
      {
        name: "Masters in Environmental Management",
        code: "MSC-ENV01",
        description:
          "Focuses on sustainability, climate adaptation, and policy analysis.",
        durationYears: 2,
        tuitionFee: 12000,
        level: "Masters",
      },
      {
        name: "Masters in Business Administration (MBA)",
        code: "MBA01",
        description:
          "Postgraduate program in leadership, strategic planning, and global business.",
        durationYears: 2,
        tuitionFee: 13000,
        level: "Masters",
      },
      {
        name: "Masters in Information Technology",
        code: "MSC-IT01",
        description:
          "Specialization in cybersecurity, cloud computing, and data analytics.",
        durationYears: 2,
        tuitionFee: 12500,
        level: "Masters",
      },
      {
        name: "Masters in Public Health",
        code: "MSC-PH01",
        description:
          "Advanced training in epidemiology, healthcare management, and policy.",
        durationYears: 2,
        tuitionFee: 12700,
        level: "Masters",
      },
      {
        name: "Masters in Education Leadership",
        code: "MSC-EDU01",
        description:
          "Focuses on school leadership, curriculum innovation, and policy reform.",
        durationYears: 2,
        tuitionFee: 11500,
        level: "Masters",
      },
    ]);

    console.log(`✅ Seeded ${programmes.length} programmes`);

    // Close connection
    mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedData();
