/**
 * Copperstone University Programme Seeder
 * ---------------------------------------
 * Clears old programmes and seeds all 9 schools with real data + One-Day Trainings
 * Prepared by: Samuel Katumba
 */

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

    // Clear existing programmes
    await Programme.deleteMany({});
    console.log("🗑️ Cleared old programmes");

    // ✅ Helper function for codes
    const code = (abbr, index) =>
      `${abbr.toUpperCase()}-${String(index).padStart(2, "0")}`;

    // ✅ Programmes grouped by school
    const programmes = [
      // =========================
      // 1. SCHOOL OF BUSINESS & ECONOMICS
      // =========================
      {
        name: "Bachelor of Business Administration",
        code: code("BBA", 1),
        description:
          "Covers leadership, management, and organizational strategy.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Marketing",
        code: code("BMK", 2),
        description:
          "Focuses on branding, market research, and customer engagement.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Human Resource Management",
        code: code("BHR", 3),
        description:
          "Explores HR strategy, labor law, and performance management.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Finance and Accounting",
        code: code("BFA", 4),
        description:
          "Prepares students in corporate finance, taxation, and auditing.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Logistics and Transport",
        code: code("BLT", 5),
        description: "Covers supply chain, distribution, and fleet management.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Purchasing & Supply",
        code: code("BPS", 6),
        description:
          "Teaches procurement, supplier relations, and contract management.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Local Government Administration",
        code: code("BLGA", 7),
        description:
          "Focuses on governance, decentralization, and community administration.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Project Planning and Management",
        code: code("BPPM", 8),
        description:
          "Teaches planning, implementation, and monitoring of projects.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Science in Economics",
        code: code("BSE", 9),
        description: "Covers micro, macro, and development economics.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Business Administration",
        code: code("DBA", 10),
        description: "Introduces key concepts in business and management.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Marketing",
        code: code("DMK", 11),
        description: "Teaches promotion, advertising, and market strategy.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Project Planning & Management",
        code: code("DPPM", 12),
        description: "Covers basic project cycle management and reporting.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Finance and Accounting",
        code: code("DFA", 13),
        description:
          "Teaches bookkeeping, cost accounting, and financial statements.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Human Resource Management",
        code: code("DHR", 14),
        description:
          "Covers HR functions, labor laws, and performance reviews.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Local Government Administration",
        code: code("DLGA", 15),
        description: "Introduces administrative systems and governance models.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Purchasing & Supply",
        code: code("DPS", 16),
        description: "Covers inventory, logistics, and procurement basics.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Transport & Logistics",
        code: code("DTL", 17),
        description: "Focuses on logistics operations and fleet coordination.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Writing a Winning Business Proposal",
        code: code("ODT-BUS", 1),
        description:
          "Learn to write a professional funding proposal (CDF or donor).",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 2. SCHOOL OF SOCIAL SCIENCES
      // =========================
      {
        name: "Bachelor of Social Work",
        code: code("BSW", 1),
        description:
          "Trains professionals in social welfare and community development.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Development Studies",
        code: code("BDS", 2),
        description:
          "Focuses on poverty reduction, development policy, and governance.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of International Relations and Development",
        code: code("BIRD", 3),
        description:
          "Explores diplomacy, conflict resolution, and global development.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Social Work",
        code: code("DSW", 4),
        description:
          "Provides a foundation in human services and social policy.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Development Studies",
        code: code("DDS", 5),
        description:
          "Introduces community development and empowerment strategies.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in International Relations and Development",
        code: code("DIRD", 6),
        description: "Covers basic international cooperation and negotiation.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Conflict Resolution in National and International Politics",
        code: code("ODT-SOC", 1),
        description: "Learn negotiation and peacebuilding techniques.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 3. SCHOOL OF PHYSICAL SCIENCE AND MATHEMATICS
      // =========================
      {
        name: "Bachelor of Electrical Engineering",
        code: code("BEE", 1),
        description: "Focuses on power systems, electronics, and design.",
        durationYears: 4,
        tuitionFee: 10500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Building & Construction",
        code: code("BBC", 2),
        description:
          "Covers structural design, materials, and site management.",
        durationYears: 4,
        tuitionFee: 10500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Mechanical Engineering",
        code: code("BME", 3),
        description: "Includes thermodynamics, design, and manufacturing.",
        durationYears: 4,
        tuitionFee: 10500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Mining Engineering",
        code: code("BMIN", 4),
        description: "Focuses on mine design, safety, and sustainability.",
        durationYears: 4,
        tuitionFee: 10500,
        level: "Bachelor",
      },
      {
        name: "Diploma in Electrical Engineering",
        code: code("DEE", 5),
        description: "Covers electrical systems and maintenance.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Mechanical Engineering",
        code: code("DME", 6),
        description: "Teaches machine design and workshop practice.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Mining Engineering",
        code: code("DMIN", 7),
        description: "Covers mining processes and safety standards.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Building & Construction",
        code: code("DBC", 8),
        description: "Introduces civil engineering and site management.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Certificate in Mining Engineering",
        code: code("CME", 9),
        description: "Basics of mining operations and safety.",
        durationYears: 2,
        tuitionFee: 3500,
        level: "Certificate",
      },
      {
        name: "One-Day Training: Mining Safety & Hazard Prevention",
        code: code("ODT-MIN", 1),
        description: "Learn basic mine safety and sustainable practices.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 4. INSTITUTE OF OCCUPATIONAL SAFETY, HEALTH & ENVIRONMENTAL SCIENCE
      // =========================
      {
        name: "Bachelor of Science in Occupational Safety, Health & Environment",
        code: code("BOSH", 1),
        description:
          "Focuses on workplace safety, health, and environmental systems.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Fire Safety Engineering",
        code: code("BFSE", 2),
        description: "Covers fire prevention, protection, and investigation.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Environmental Health Science",
        code: code("DEHS", 3),
        description: "Focuses on sanitation and public health management.",
        durationYears: 3,
        tuitionFee: 6500,
        level: "Diploma",
      },
      {
        name: "Diploma in Occupational Safety, Health & Environment",
        code: code("DOSHE", 4),
        description: "Covers risk management and safety compliance.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Fire Safety Engineering",
        code: code("DFSE", 5),
        description: "Covers fire risk assessment and safety design.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Accident Prevention & Hazard Identification",
        code: code("ODT-SAF", 1),
        description: "Learn hazard identification and accident prevention.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 5. FACULTY OF MEDIA & COMMUNICATION STUDIES
      // =========================
      {
        name: "Bachelor of Mass Communication",
        code: code("BMC", 1),
        description: "Covers journalism, broadcasting, and digital media.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Public Relations",
        code: code("BPR", 2),
        description: "Focuses on brand communication and media relations.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Public Relations",
        code: code("DPR", 3),
        description:
          "Introduces communication strategy and public image management.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Journalism",
        code: code("DJ", 4),
        description: "Teaches news writing, reporting, and media ethics.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Digital Marketing for Beginners",
        code: code("ODT-MED", 1),
        description: "Learn to start professional online marketing campaigns.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 6. FACULTY OF INFORMATION TECHNOLOGY & COMPUTING
      // =========================
      {
        name: "Bachelor of Science in Information Technology",
        code: code("BSIT", 1),
        description: "Covers networking, databases, and software systems.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Computer Science",
        code: code("BCS", 2),
        description: "Focuses on algorithms, software engineering, and AI.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Information Technology",
        code: code("DIT", 3),
        description:
          "Introduces IT infrastructure, databases, and user support.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "Diploma in Computer Science",
        code: code("DCS", 4),
        description:
          "Covers basic programming, web development, and data management.",
        durationYears: 3,
        tuitionFee: 3500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Build and Deploy a Business Website",
        code: code("ODT-IT", 1),
        description:
          "Create a simple professional website and deploy it online.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 7. SCHOOL OF EDUCATION
      // =========================
      {
        name: "Bachelor of Secondary Education",
        code: code("BSED", 1),
        description: "Prepares teachers for secondary school education.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Primary Education",
        code: code("BPED", 2),
        description: "Trains teachers for primary level education.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Computer Science with Education",
        code: code("BCSE", 3),
        description: "Combines IT with pedagogy for teaching.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Arts with Education",
        code: code("BAE", 4),
        description: "Covers arts education and curriculum design.",
        durationYears: 4,
        tuitionFee: 6200,
        level: "Bachelor",
      },
      {
        name: "Diploma in Primary Education",
        code: code("DPE", 5),
        description: "Focuses on early childhood and primary methods.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Secondary Education",
        code: code("DSE", 6),
        description:
          "Prepares secondary educators with subject specialization.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "One-Day Training: Preparing Lesson Plans and Schemes of Work",
        code: code("ODT-EDU", 1),
        description:
          "Learn to design lesson plans aligned with Zambia’s new curriculum.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 8. INSTITUTE OF FORENSICS & STRATEGIC STUDIES
      // =========================
      {
        name: "Bachelor of Forensic Auditing/Accounting",
        code: code("BFAA", 1),
        description:
          "Combines accounting and investigation of financial crimes.",
        durationYears: 4,
        tuitionFee: 9500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Science in Forensic Science",
        code: code("BSFS", 2),
        description:
          "Covers crime scene investigation, lab techniques, and evidence analysis.",
        durationYears: 4,
        tuitionFee: 9500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Investigations & Security Management",
        code: code("BISM", 3),
        description:
          "Focuses on intelligence, investigation, and risk management.",
        durationYears: 4,
        tuitionFee: 7500,
        level: "Bachelor",
      },
      {
        name: "Bachelor of Laws (LLB)",
        code: code("BLLB", 4),
        description:
          "Undergraduate law program in Zambian and international legal systems.",
        durationYears: 4,
        tuitionFee: 9500,
        level: "Bachelor",
      },
      {
        name: "Diploma in Forensic Auditing/Accounting",
        code: code("DFAA", 5),
        description: "Introduces fraud detection and forensic audits.",
        durationYears: 3,
        tuitionFee: 7500,
        level: "Diploma",
      },
      {
        name: "Diploma in Forensic Science",
        code: code("DFS", 6),
        description: "Covers laboratory techniques and evidence handling.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Investigations & Security Management",
        code: code("DISM", 7),
        description:
          "Focuses on security operations and corporate intelligence.",
        durationYears: 3,
        tuitionFee: 5500,
        level: "Diploma",
      },
      {
        name: "Diploma in Laws",
        code: code("DLW", 8),
        description: "Introduces Zambian legal foundations and case law.",
        durationYears: 3,
        tuitionFee: 7500,
        level: "Diploma",
      },
      {
        name: "Certificate in Forensic Auditing/Accounting",
        code: code("CFAA", 9),
        description:
          "Covers basics of fraud investigation and financial tracing.",
        durationYears: 1,
        tuitionFee: 4500,
        level: "Certificate",
      },
      {
        name: "Certificate in Forensic Science",
        code: code("CFS", 10),
        description: "Introduces crime scene handling and basic lab work.",
        durationYears: 1,
        tuitionFee: 3500,
        level: "Certificate",
      },
      {
        name: "One-Day Training: Introduction to Forensic Investigation",
        code: code("ODT-FOR", 1),
        description:
          "Learn professional evidence handling and forensic documentation.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },

      // =========================
      // 9. SCHOOL OF POSTGRADUATE STUDIES
      // =========================
      {
        name: "Master of Forensic Accounting & Auditing",
        code: code("MFAA", 1),
        description: "Advanced study of fraud, auditing, and investigation.",
        durationYears: 2,
        tuitionFee: 15500,
        level: "Masters",
      },
      {
        name: "Master of Business Administration (MBA)",
        code: code("MBA", 2),
        description:
          "Strategic leadership, planning, and corporate management.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Master of Business Administration (By Research)",
        code: code("MBAR", 3),
        description: "Research-based MBA for specialized business solutions.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Master of Social Work",
        code: code("MSW", 4),
        description:
          "Advanced theory and practice in social welfare and development.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Master of Development Studies",
        code: code("MDS", 5),
        description:
          "Covers research in governance, human development, and policy.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Master of Education (Coursework & Research)",
        code: code("MED", 6),
        description:
          "Focuses on educational management and instructional leadership.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Master of Laws (LLM)",
        code: code("MLL", 7),
        description: "Postgraduate law degree in justice and human rights.",
        durationYears: 2,
        tuitionFee: 15500,
        level: "Masters",
      },
      {
        name: "Master of Occupational Health, Safety & Environmental Science",
        code: code("MOHS", 8),
        description:
          "Research on environmental protection and workplace safety.",
        durationYears: 2,
        tuitionFee: 13500,
        level: "Masters",
      },
      {
        name: "Postgraduate Diploma in Teaching Methodology",
        code: code("PGDTM", 9),
        description:
          "Advanced training in pedagogy and instructional techniques.",
        durationYears: 1,
        tuitionFee: 5500,
        level: "Masters",
      },
      {
        name: "One-Day Training: Research Proposal Writing",
        code: code("ODT-PG", 1),
        description:
          "Learn to structure and write a professional postgraduate proposal.",
        durationYears: 0.01,
        tuitionFee: 250,
        level: "Certificate",
      },
    ];

    // ✅ Insert all programmes
    const inserted = await Programme.insertMany(programmes);
    console.log(`✅ Seeded ${inserted.length} programmes successfully`);

    mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedData();
