// backend/seedAcademicStaff.js - Complete academic setup
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Course");
const Programme = require("./models/Programme");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for Academic Staff Setup");

    // Step 1: Ensure some programmes exist
    console.log("\n📋 Step 1: Checking programmes...");
    const programmes = await Programme.find().limit(5);

    if (programmes.length === 0) {
      console.log(
        "⚠️ No programmes found. Please run programme seeding first."
      );
      // Create sample programmes if none exist
      const sampleProgrammes = [
        { name: "Bachelor of Science", code: "BSC001", level: "Bachelor" },
        { name: "Diploma in Engineering", code: "DIP-ENG01", level: "Diploma" },
        { name: "Certificate in IT", code: "CERT-IT01", level: "Certificate" },
      ];

      for (const prog of sampleProgrammes) {
        await Programme.create(prog);
      }

      programmes = await Programme.find().limit(5);
      console.log("✅ Created sample programmes");
    }
    console.log(`Found ${programmes.length} programmes`);

    // Step 2: Create courses
    console.log("\n📋 Step 2: Creating/updating courses...");
    const courseData = [
      {
        code: "CHT 1101",
        name: "Chemistry I",
        description: "Introduction to basic chemistry principles",
        credits: 4,
        department: "Physical Sciences",
      },
      {
        code: "PHY 1102",
        name: "Physics I",
        description: "Fundamentals of mechanics and thermodynamics",
        credits: 4,
        department: "Physical Sciences",
      },
      {
        code: "MAT 1103",
        name: "Mathematics I",
        description: "Algebra and calculus for science",
        credits: 3,
        department: "Physical Sciences",
      },
      {
        code: "BIO 1104",
        name: "Biology I",
        description: "Introduction to cell biology and genetics",
        credits: 4,
        department: "Biological Sciences",
      },
      {
        code: "CS 101",
        name: "Communication Skills",
        description: "Academic writing and presentation skills",
        credits: 3,
        department: "Humanities",
      },
    ];

    const courseIds = {};
    for (const c of courseData) {
      let course = await Course.findOne({ code: c.code });
      if (!course) {
        course = await Course.create({
          ...c,
          programmes: programmes.slice(0, 3).map((p) => p._id),
          category: "Academic",
        });
        console.log(`✅ Created: ${c.code}`);
      } else {
        console.log(`⏭️ Exists: ${c.code}`);
      }
      courseIds[c.code] = course._id;
    }

    // Step 3: Create lecturers
    console.log("\n📋 Step 3: Creating lecturers...");
    const lecturers = [
      {
        firstName: "David",
        surname: "Banda",
        email: "david.banda@copperstone.ac.zm",
        mobile: "260971111111",
        staffId: "LEC001",
        department: "Physical Sciences",
        courses: ["CHT 1101"],
      },
      {
        firstName: "Sarah",
        surname: "Mwape",
        email: "sarah.mwape@copperstone.ac.zm",
        mobile: "260971111112",
        staffId: "LEC002",
        department: "Physical Sciences",
        courses: ["PHY 1102", "MAT 1103"],
      },
      {
        firstName: "Peter",
        surname: "Chanda",
        email: "peter.chanda@copperstone.ac.zm",
        mobile: "260971111113",
        staffId: "LEC003",
        department: "Biological Sciences",
        courses: ["BIO 1104"],
      },
      {
        firstName: "Grace",
        surname: "Sichone",
        email: "grace.sichone@copperstone.ac.zm",
        mobile: "260971111114",
        staffId: "LEC004",
        department: "Humanities",
        courses: ["CS 101"],
      },
      {
        firstName: "Michael",
        surname: "Kabwe",
        email: "michael.kabwe@copperstone.ac.zm",
        mobile: "260971111115",
        staffId: "LEC005",
        department: "Business",
        courses: [],
      },
    ];

    const lecturerIds = {};
    for (const lec of lecturers) {
      let lecturer = await User.findOne({ email: lec.email });

      if (!lecturer) {
        lecturer = new User({
          firstName: lec.firstName,
          surname: lec.surname,
          email: lec.email,
          mobile: lec.mobile,
          role: "Lecturer",
          staffProfile: {
            position: "Lecturer",
            department: lec.department,
            staffId: lec.staffId,
            employmentDate: new Date("2022-01-01"),
          },
        });

        await User.register(lecturer, `Lecturer${lec.staffId}@2024`);
        console.log(`✅ Created: ${lec.firstName} ${lec.surname}`);
      } else {
        console.log(`⏭️ Exists: ${lec.firstName} ${lec.surname}`);
      }
      lecturerIds[lec.email] = lecturer._id;
    }

    // Step 4: Assign lecturers to courses
    console.log("\n📋 Step 4: Assigning lecturers to courses...");
    for (const lec of lecturers) {
      for (const courseCode of lec.courses) {
        const course = await Course.findOne({ code: courseCode });
        const lecturerId = lecturerIds[lec.email];

        if (course && lecturerId && !course.lecturers.includes(lecturerId)) {
          course.lecturers.push(lecturerId);
          await course.save();
          console.log(`✅ Assigned ${lec.firstName} to ${courseCode}`);
        }
      }
    }

    // Step 5: Display summary
    console.log("\n🎉 ACADEMIC STAFF SETUP COMPLETE!");
    console.log("=========================================");
    console.log(`Courses created: ${Object.keys(courseIds).length}`);
    console.log(`Lecturers created: ${Object.keys(lecturerIds).length}`);

    console.log("\n📋 LECTURER LOGIN CREDENTIALS:");
    console.log("=========================================");
    lecturers.forEach((lec) => {
      console.log(`${lec.firstName} ${lec.surname}`);
      console.log(`  Email: ${lec.email}`);
      console.log(`  Password: Lecturer${lec.staffId}@2024`);
      console.log(`  Courses: ${lec.courses.join(", ") || "None assigned"}`);
      console.log("---");
    });

    console.log(
      "\n⚠️ IMPORTANT: All users should change passwords after first login!"
    );

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error in academic staff setup:", err);
    process.exit(1);
  }
})();
