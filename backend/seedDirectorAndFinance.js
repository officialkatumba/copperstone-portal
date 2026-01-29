const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    /* ================================
       DIRECTOR ACADEMIC
    ================================= */
    const directorEmail = "mulimamundia86@gmail.com";
    const existingDirector = await User.findOne({ email: directorEmail });

    if (existingDirector) {
      console.log("ℹ️ Director Academic already exists");
      console.log("📧 Email:", existingDirector.email);
      console.log("📱 Mobile:", existingDirector.mobile);
      console.log("👤 Role:", existingDirector.role);
    } else {
      const director = new User({
        firstName: "Mulima",
        surname: "Mundia",
        otherNames: "",
        email: directorEmail,
        mobile: "0978939000",
        role: "DirectorAcademic",
        department: "Academics",
        isActive: true,
      });

      await User.register(director, "Admin@123");

      console.log("✅ Director Academic account created successfully!");
      console.log("📧 Email:", directorEmail);
      console.log("📱 Mobile:", director.mobile);
      console.log("👤 Role:", director.role);
      console.log("🔐 Password:", "Admin@123");
      console.log("👤 Name:", `${director.firstName} ${director.surname}`);
    }

    /* ================================
       FINANCE OFFICER
    ================================= */
    const financeEmail = "prudecekaeshe@gmail.com";
    const existingFinance = await User.findOne({ email: financeEmail });

    if (existingFinance) {
      console.log("ℹ️ Finance Officer already exists");
      console.log("📧 Email:", existingFinance.email);
      console.log("📱 Mobile:", existingFinance.mobile);
      console.log("👤 Role:", existingFinance.role);
    } else {
      const financeOfficer = new User({
        firstName: "Prudence",
        surname: "Mulenga",
        otherNames: "",
        email: financeEmail,
        mobile: "0975174357",
        role: "FinanceOfficer",
        department: "Finance",
        isActive: true,
      });

      await User.register(financeOfficer, "Admin@123");

      console.log("✅ Finance Officer account created successfully!");
      console.log("📧 Email:", financeEmail);
      console.log("📱 Mobile:", financeOfficer.mobile);
      console.log("👤 Role:", financeOfficer.role);
      console.log("🔐 Password:", "Admin@123");
      console.log(
        "👤 Name:",
        `${financeOfficer.firstName} ${financeOfficer.surname}`,
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Director Academic & Finance Officer:", err);
    process.exit(1);
  }
})();
