const BedSpace = require("../models/BedSpace");

// ================= BOARDING PAGE =================
exports.boardingManagement = async (req, res) => {
  try {
    const bedSpaces = await BedSpace.find().sort({ bedCode: 1 }).lean();

    const totalBeds = bedSpaces.length;
    const occupiedBeds = bedSpaces.filter(
      (b) => b.status === "occupied"
    ).length;

    res.render("dean-of-students/boarding", {
      title: "Boarding Management",
      user: req.user,
      bedSpaces,
      stats: {
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load boarding data");
    return res.redirect("/dashboard/dean-of-students");
  }
};

// ================= CREATE 256 BED SPACES =================
exports.createBedSpaces = async (req, res) => {
  try {
    await BedSpace.deleteMany({});

    const beds = [];
    let roomNo = 1;

    // 64 ROOMS × 4 BEDS = 256
    for (let i = 1; i <= 64; i++) {
      const wing = i <= 32 ? "Female" : "Male";
      const floor = Math.ceil(i / 8);

      for (const letter of ["A", "B", "C", "D"]) {
        beds.push({
          bedCode: `${roomNo}${letter}`,
          roomNumber: `Room ${roomNo}`,
          wing,
          floor,
          status: "available",
          feeType: "full-time",
          amount: 1200,
          paymentStatus: "pending",
        });
      }
      roomNo++;
    }

    await BedSpace.insertMany(beds);
    req.flash("success_msg", "256 bed spaces created successfully");
    return res.redirect("/dean-of-students/boarding");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to create bed spaces");
    return res.redirect("/dean-of-students/boarding");
  }
};

// ================= ALLOCATE BED (NO DOUBLE ALLOCATION) =================
exports.allocateBed = async (req, res) => {
  try {
    const { bedSpaceId, studentName, feeType } = req.body;

    if (!bedSpaceId || !studentName) {
      req.flash("error_msg", "Student name and bed are required");
      return res.redirect("/dean-of-students/boarding");
    }

    // 🔒 Prevent student having multiple beds
    const alreadyAllocated = await BedSpace.findOne({
      studentName,
      status: "occupied",
    });

    if (alreadyAllocated) {
      req.flash("error_msg", "This student already has a bed allocated");
      return res.redirect("/dean-of-students/boarding");
    }

    const bed = await BedSpace.findById(bedSpaceId);
    if (!bed || bed.status === "occupied") {
      req.flash("error_msg", "Bed already occupied");
      return res.redirect("/dean-of-students/boarding");
    }

    await BedSpace.findByIdAndUpdate(bedSpaceId, {
      status: "occupied",
      studentName: studentName.trim(),
      feeType,
      amount: feeType === "part-time" ? 400 : 1200,
      paymentStatus: "pending",
      allocatedDate: new Date(),
    });

    req.flash("success_msg", "Bed allocated successfully");
    return res.redirect("/dean-of-students/boarding");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to allocate bed");
    return res.redirect("/dean-of-students/boarding");
  }
};

// ================= MARK PAYMENT PAID =================
exports.markPaymentPaid = async (req, res) => {
  try {
    await BedSpace.findByIdAndUpdate(req.body.bedSpaceId, {
      paymentStatus: "paid",
      paymentDate: new Date(),
    });

    req.flash("success_msg", "Payment marked as paid");
    return res.redirect("/dean-of-students/boarding");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to update payment");
    return res.redirect("/dean-of-students/boarding");
  }
};

// ================= VACATE BED =================
exports.vacateBed = async (req, res) => {
  try {
    await BedSpace.findByIdAndUpdate(req.body.bedSpaceId, {
      status: "available",
      studentName: null,
      paymentStatus: "pending",
      vacatedDate: new Date(),
    });

    req.flash("success_msg", "Bed vacated successfully");
    return res.redirect("/dean-of-students/boarding");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to vacate bed");
    return res.redirect("/dean-of-students/boarding");
  }
};
