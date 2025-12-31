// backend/middleware/auth.js

/**
 * Middleware to check if user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please log in to access this page");
  res.redirect("/login");
};

/**
 * Middleware to check if user is NOT authenticated
 */
const ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  switch (req.user.role) {
    case "Student":
      return res.redirect("/dashboard/student");
    case "Lecturer":
      return res.redirect("/dashboard/lecturer");
    case "Admin":
      return res.redirect("/dashboard/admin");
    case "AdmissionsOfficer":
      return res.redirect("/dashboard/admissions");
    case "FinanceOfficer":
      return res.redirect("/dashboard/finance");
    case "Registrar":
      return res.redirect("/dashboard/registrar");
    case "VC":
      return res.redirect("/dashboard/vc");
    case "Dean":
      return res.redirect("/dashboard/dean");
    default:
      return res.redirect("/dashboard");
  }
};

/**
 * Role-based middleware (supports multiple roles)
 */
const ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "Please log in to access this page");
      return res.redirect("/login");
    }

    if (!roles.includes(req.user.role)) {
      req.flash("error", "You do not have permission to access this page");

      // Redirect based on actual role
      switch (req.user.role) {
        case "Student":
          return res.redirect("/dashboard/student");
        case "Lecturer":
          return res.redirect("/dashboard/lecturer");
        case "Admin":
          return res.redirect("/dashboard/admin");
        case "AdmissionsOfficer":
          return res.redirect("/dashboard/admissions");
        case "FinanceOfficer":
          return res.redirect("/dashboard/finance");
        case "Registrar":
          return res.redirect("/dashboard/registrar");
        case "VC":
          return res.redirect("/dashboard/vc");
        case "Dean":
          return res.redirect("/dashboard/dean");
        default:
          return res.redirect("/dashboard");
      }
    }
    next();
  };
};

/**
 * Middleware to set user locals for views
 */
const setUserLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
};

// Role-specific helpers (using ensureRole)
const ensureStudent = ensureRole("Student");
const ensureLecturer = ensureRole("Lecturer");
const ensureFinanceOfficer = ensureRole("FinanceOfficer");
const ensureAdmissionsOfficer = ensureRole("AdmissionsOfficer");
const ensureRegistrar = ensureRole("Registrar");
const ensureVC = ensureRole("VC");
const ensureDean = ensureRole("Dean");

const ensureAdmin = ensureRole(
  "Admin",
  "AdmissionsOfficer",
  "FinanceOfficer",
  "Registrar",
  "VC",
  "Dean"
);
const ensureAcademicStaff = ensureRole("Lecturer", "Dean", "Registrar", "VC");
const ensureAdministrativeStaff = ensureRole(
  "Admin",
  "AdmissionsOfficer",
  "FinanceOfficer"
);

/**
 * Profile completion check (Students only)
 */
const ensureProfileComplete = (req, res, next) => {
  if (req.user?.role === "Student") {
    const status = req.user.studentProfile?.registrationStatus || "Pending";
    if (["Pending", "In Progress"].includes(status)) {
      req.flash("warning", "Please complete your profile registration first");
      return res.redirect("/student/complete-profile");
    }
  }
  next();
};

/**
 * Admission approval check (Students only)
 */
const ensureAdmissionApproved = (req, res, next) => {
  if (req.user?.role === "Student") {
    const status = req.user.studentProfile?.admissionStatus || "Applied";
    if (status === "Applied") {
      req.flash("warning", "Your admission is still pending approval");
      return res.redirect("/dashboard/student");
    }
  }
  next();
};

// ✅ SINGLE EXPORT - No duplicates
module.exports = {
  ensureAuthenticated,
  ensureNotAuthenticated,
  ensureRole,
  setUserLocals,
  ensureStudent,
  ensureLecturer,
  ensureAdmin,
  ensureDean,
  ensureVC,
  ensureRegistrar, // Use this for Registrar routes
  ensureAdmissionsOfficer,
  ensureFinanceOfficer,
  ensureAcademicStaff,
  ensureAdministrativeStaff,
  ensureProfileComplete,
  ensureAdmissionApproved,
};
