const User = require("../models/User");
const { uploadFile } = require("../utils/gcs");

exports.showRegistrationForm = (req, res) => {
  res.render("students/registration", {
    title: "Student Registration",
    user: req.user,
  });
};

exports.submitRegistration = async (req, res) => {
  try {
    const {
      dateOfBirth,
      gender,
      nationality,
      nationalIdNumber,
      street,
      city,
      province,
      postalCode,
      emergencyFullName,
      emergencyRelation,
      emergencyPhone,
      emergencyEmail,
      institution,
      qualification,
      yearCompleted,
    } = req.body;

    const studentProfile = {
      personalInfo: {
        dateOfBirth,
        gender,
        nationality,
        nationalIdNumber,
      },
      contactAddress: {
        street,
        city,
        province,
        postalCode,
      },
      emergencyContact: {
        fullName: emergencyFullName,
        relation: emergencyRelation,
        phone: emergencyPhone,
        email: emergencyEmail,
      },
      previousEducation: [
        {
          institution,
          qualification,
          yearCompleted,
        },
      ],
      registrationStatus: "Completed",
      admissionStatus: "Registered",
    };

    // ✅ Handle profile picture upload
    if (req.file) {
      const destPath = `profile_pictures/${req.user._id}_${Date.now()}`;
      await uploadFile(req.file.path, destPath);
      studentProfile.profilePicture = {
        gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`,
        gcsPath: destPath,
        uploadedAt: new Date(),
      };
    }

    await User.findByIdAndUpdate(req.user._id, {
      studentProfile,
    });

    req.flash("success_msg", "Registration completed successfully!");
    res.redirect("/dashboard/student");
  } catch (err) {
    console.error("❌ Registration error:", err);
    req.flash("error_msg", "Failed to complete registration.");
    res.redirect("back");
  }
};
