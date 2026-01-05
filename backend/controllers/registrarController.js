// backend/controllers/registrarController.js

const Group = require("../models/Group");
const Programme = require("../models/Programme");
const Course = require("../models/Course");
const User = require("../models/User");

// Get create group page
// exports.getCreateGroup = async (req, res) => {
//   try {
//     const programmes = await Programme.find({ isActive: true });
//     const courses = await Course.find({ isActive: true });
//     const lecturers = await User.find({
//       role: "Lecturer",
//       isActive: true,
//     }).select("firstName surname email staffProfile.department");

//     res.render("registrar/create-group", {
//       title: "Create Academic Group",
//       programmes,
//       courses,
//       lecturers,
//       user: req.user,
//     });
//   } catch (error) {
//     console.error("Error loading create group page:", error);
//     req.flash("error", "Error loading create group page");
//     res.redirect("/registrar/dashboard");
//   }
// };

// controllers/registrarController.js

exports.getCreateGroup = (req, res) => {
  try {
    console.log("route hit");
    res.render("registrar/create-group", {
      title: "Create Academic Group (Test)",
      user: req.user,
    });
  } catch (error) {
    console.error("Simple create-group error:", error);
    res.send("Create group page failed");
  }
};

// Create new group
exports.createGroup = async (req, res) => {
  try {
    const {
      programme,
      name,
      academicYear,
      semester,
      yearOfStudy,
      groupType,
      section,
      lecturers,
      coordinator,
      courses,
      capacity,
      meetingDays,
      meetingTimeStart,
      meetingTimeEnd,
      venue,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!programme || !name || !academicYear || !semester || !yearOfStudy) {
      req.flash("error", "Please fill in all required fields");
      return res.redirect("/registrar/groups/create");
    }

    // Validate academic year format
    if (!/^\d{4}\/\d{4}$/.test(academicYear)) {
      req.flash("error", "Academic year must be in format YYYY/YYYY");
      return res.redirect("/registrar/groups/create");
    }

    // Validate year of study
    const yearNum = parseInt(yearOfStudy);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 8) {
      req.flash("error", "Year of study must be between 1 and 8");
      return res.redirect("/registrar/groups/create");
    }

    // Convert to arrays
    const lecturersArray = Array.isArray(lecturers)
      ? lecturers
      : lecturers
      ? [lecturers]
      : [];
    const coursesArray = Array.isArray(courses)
      ? courses
      : courses
      ? [courses]
      : [];
    const meetingDaysArray = Array.isArray(meetingDays)
      ? meetingDays
      : meetingDays
      ? [meetingDays]
      : [];

    // Create new group
    const newGroup = new Group({
      programme,
      name,
      academicYear,
      semester,
      yearOfStudy: yearNum,
      groupType: groupType || "Regular",
      section: section || "A",
      lecturers: lecturersArray,
      coordinator: coordinator || null,
      courses: coursesArray,
      capacity: capacity ? parseInt(capacity) : 50,
      meetingDays: meetingDaysArray,
      meetingTime: {
        start: meetingTimeStart || "",
        end: meetingTimeEnd || "",
      },
      venue: venue || "",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "Draft",
      createdBy: req.user._id,
    });

    await newGroup.save();
    req.flash("success", `Group "${name}" created successfully`);
    res.redirect("/registrar/groups");
  } catch (error) {
    console.error("Error creating group:", error);
    req.flash("error", "Error creating group. Please try again.");
    res.redirect("/registrar/groups/create");
  }
};

// List all groups
exports.listGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    if (req.query.semester) {
      filter.semester = req.query.semester;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.programme) {
      filter.programme = req.query.programme;
    }

    // Get groups with pagination
    const groups = await Group.find(filter)
      .populate("programme", "name code")
      .populate("lecturers", "firstName surname")
      .populate("coordinator", "firstName surname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get counts for filter options
    const totalGroups = await Group.countDocuments(filter);
    const programmes = await Programme.find({ isActive: true });

    // Get unique academic years for filter dropdown
    const academicYears = await Group.distinct("academicYear");
    const semesters = [
      "Semester 1",
      "Semester 2",
      "Semester 3",
      "Semester 4",
      "Semester 5",
      "Semester 6",
      "Semester 7",
      "Semester 8",
    ];

    res.render("registrar/groups", {
      title: "Manage Groups",
      groups,
      programmes,
      academicYears,
      semesters,
      currentPage: page,
      totalPages: Math.ceil(totalGroups / limit),
      totalGroups,
      user: req.user,
      query: req.query,
    });
  } catch (error) {
    console.error("Error loading groups:", error);
    req.flash("error", "Error loading groups");
    res.redirect("/registrar/dashboard");
  }
};

// View single group
exports.viewGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("programme")
      .populate("lecturers", "firstName surname email staffProfile.staffId")
      .populate("coordinator", "firstName surname email")
      .populate("courses", "code name credits")
      .populate("students", "firstName surname email studentId")
      .populate("createdBy", "firstName surname");

    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/registrar/groups");
    }

    // Get available students for this group (not already enrolled)
    const enrolledStudentIds = group.students.map((s) => s._id);
    const availableStudents = await User.find({
      role: "Student",
      isActive: true,
      _id: { $nin: enrolledStudentIds },
    }).select("firstName surname email studentId");

    res.render("registrar/view-group", {
      title: `Group: ${group.name}`,
      group,
      availableStudents,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading group:", error);
    req.flash("error", "Error loading group details");
    res.redirect("/registrar/groups");
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/registrar/groups");
    }

    const updates = req.body;

    // Handle arrays
    if (updates.lecturers) {
      updates.lecturers = Array.isArray(updates.lecturers)
        ? updates.lecturers
        : [updates.lecturers];
    }

    if (updates.courses) {
      updates.courses = Array.isArray(updates.courses)
        ? updates.courses
        : [updates.courses];
    }

    if (updates.meetingDays) {
      updates.meetingDays = Array.isArray(updates.meetingDays)
        ? updates.meetingDays
        : [updates.meetingDays];
    }

    // Update meeting time object
    if (updates.meetingTimeStart || updates.meetingTimeEnd) {
      updates.meetingTime = {
        start: updates.meetingTimeStart || group.meetingTime.start,
        end: updates.meetingTimeEnd || group.meetingTime.end,
      };
      delete updates.meetingTimeStart;
      delete updates.meetingTimeEnd;
    }

    // Update capacity
    if (updates.capacity) {
      updates.capacity = parseInt(updates.capacity);
    }

    // Update year of study
    if (updates.yearOfStudy) {
      updates.yearOfStudy = parseInt(updates.yearOfStudy);
    }

    // Apply updates
    Object.assign(group, updates);
    await group.save();

    req.flash("success", "Group updated successfully");
    res.redirect(`/registrar/groups/${req.params.id}`);
  } catch (error) {
    console.error("Error updating group:", error);
    req.flash("error", "Error updating group");
    res.redirect(`/registrar/groups/${req.params.id}`);
  }
};

// Add student to group
exports.addStudentToGroup = async (req, res) => {
  try {
    const { studentId } = req.body;

    const group = await Group.findById(req.params.id);
    const student = await User.findById(studentId);

    if (!group || !student) {
      req.flash("error", "Group or student not found");
      return res.redirect(`/registrar/groups/${req.params.id}`);
    }

    // Check if student is already in group
    if (group.students.includes(studentId)) {
      req.flash("warning", "Student is already in this group");
      return res.redirect(`/registrar/groups/${req.params.id}`);
    }

    // Check capacity
    if (group.students.length >= group.capacity) {
      req.flash("error", "Group is at full capacity");
      return res.redirect(`/registrar/groups/${req.params.id}`);
    }

    // Add student to group
    group.students.push(studentId);
    group.currentEnrollment = group.students.length;

    // Update enrollment status if needed
    if (group.currentEnrollment >= group.capacity) {
      group.enrollmentStatus = "Full";
    }

    await group.save();

    req.flash(
      "success",
      `Student ${student.firstName} ${student.surname} added to group`
    );
    res.redirect(`/registrar/groups/${req.params.id}`);
  } catch (error) {
    console.error("Error adding student to group:", error);
    req.flash("error", "Error adding student to group");
    res.redirect(`/registrar/groups/${req.params.id}`);
  }
};

// Remove student from group
exports.removeStudentFromGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/registrar/groups");
    }

    // Remove student from group
    group.students = group.students.filter(
      (student) => student.toString() !== req.params.studentId
    );

    group.currentEnrollment = group.students.length;

    // Update enrollment status
    if (group.currentEnrollment < group.capacity) {
      group.enrollmentStatus = "Open";
    }

    await group.save();

    req.flash("success", "Student removed from group");
    res.redirect(`/registrar/groups/${req.params.id}`);
  } catch (error) {
    console.error("Error removing student from group:", error);
    req.flash("error", "Error removing student from group");
    res.redirect(`/registrar/groups/${req.params.id}`);
  }
};

// Change group status
exports.changeGroupStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const group = await Group.findById(req.params.id);

    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/registrar/groups");
    }

    group.status = status;
    await group.save();

    req.flash("success", `Group status changed to ${status}`);
    res.redirect(`/registrar/groups/${req.params.id}`);
  } catch (error) {
    console.error("Error updating group status:", error);
    req.flash("error", "Error updating group status");
    res.redirect(`/registrar/groups/${req.params.id}`);
  }
};

// Delete/Archive group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/registrar/groups");
    }

    // Check if group has students
    if (group.students.length > 0) {
      req.flash(
        "error",
        "Cannot delete group with enrolled students. Remove students first."
      );
      return res.redirect(`/registrar/groups/${req.params.id}`);
    }

    // Soft delete by changing status
    group.status = "Archived";
    group.isActive = false;
    await group.save();

    req.flash("success", "Group archived successfully");
    res.redirect("/registrar/groups");
  } catch (error) {
    console.error("Error archiving group:", error);
    req.flash("error", "Error archiving group");
    res.redirect(`/registrar/groups/${req.params.id}`);
  }
};
