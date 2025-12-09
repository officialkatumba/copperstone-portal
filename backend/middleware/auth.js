// middleware/auth.js

/**
 * Middleware to check if user is authenticated
 * Redirects to login page if not authenticated
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
 * Redirects to dashboard if already logged in
 */
const ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  // Redirect based on user's role
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
 * Middleware to check if user has specific role(s)
 * @param {...string} roles - Allowed roles
 */
const ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "Please log in to access this page");
      return res.redirect("/login");
    }

    if (!roles.includes(req.user.role)) {
      req.flash("error", "You do not have permission to access this page");

      // Redirect based on user's role
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
 * Middleware to set user information to locals for views
 */
const setUserLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
};

/**
 * Middleware to check if user is a Student
 */
const ensureStudent = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "Student") {
    req.flash("error", "This page is only accessible to students");

    // Redirect based on actual role
    switch (req.user.role) {
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

/**
 * Middleware to check if user is a Lecturer
 */
const ensureLecturer = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "Lecturer") {
    req.flash("error", "This page is only accessible to lecturers");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
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

/**
 * Middleware to check if user is Admin, AdmissionsOfficer, FinanceOfficer, Registrar, VC, or Dean
 */
const ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  const adminRoles = [
    "Admin",
    "AdmissionsOfficer",
    "FinanceOfficer",
    "Registrar",
    "VC",
    "Dean",
  ];

  if (!adminRoles.includes(req.user.role)) {
    req.flash("error", "Administrative access required");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
      case "Lecturer":
        return res.redirect("/dashboard/lecturer");
      default:
        return res.redirect("/dashboard");
    }
  }

  next();
};

/**
 * Middleware to check if user is Dean
 */
const ensureDean = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "Dean") {
    req.flash("error", "Dean access required");

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
      default:
        return res.redirect("/dashboard");
    }
  }

  next();
};

/**
 * Middleware to check if user is VC
 */
const ensureVC = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "VC") {
    req.flash("error", "Vice Chancellor access required");

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
      case "Dean":
        return res.redirect("/dashboard/dean");
      default:
        return res.redirect("/dashboard");
    }
  }

  next();
};

/**
 * Middleware to check if user is Registrar
 */
const ensureRegistrar = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "Registrar") {
    req.flash("error", "Registrar access required");

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

/**
 * Middleware to check if user is Admissions Officer
 */
const ensureAdmissionsOfficer = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "AdmissionsOfficer") {
    req.flash("error", "Admissions Officer access required");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
      case "Lecturer":
        return res.redirect("/dashboard/lecturer");
      case "Admin":
        return res.redirect("/dashboard/admin");
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

/**
 * Middleware to check if user is Finance Officer
 */
const ensureFinanceOfficer = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  if (req.user.role !== "FinanceOfficer") {
    req.flash("error", "Finance Officer access required");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
      case "Lecturer":
        return res.redirect("/dashboard/lecturer");
      case "Admin":
        return res.redirect("/dashboard/admin");
      case "AdmissionsOfficer":
        return res.redirect("/dashboard/admissions");
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

/**
 * Middleware to check if user is academic staff (Lecturer, Dean, Registrar, VC)
 */
const ensureAcademicStaff = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  const academicRoles = ["Lecturer", "Dean", "Registrar", "VC"];

  if (!academicRoles.includes(req.user.role)) {
    req.flash("error", "Academic staff access required");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
      case "Admin":
        return res.redirect("/dashboard/admin");
      case "AdmissionsOfficer":
        return res.redirect("/dashboard/admissions");
      case "FinanceOfficer":
        return res.redirect("/dashboard/finance");
      default:
        return res.redirect("/dashboard");
    }
  }

  next();
};

/**
 * Middleware to check if user is administrative staff (Admin, AdmissionsOfficer, FinanceOfficer)
 */
const ensureAdministrativeStaff = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  const administrativeRoles = ["Admin", "AdmissionsOfficer", "FinanceOfficer"];

  if (!administrativeRoles.includes(req.user.role)) {
    req.flash("error", "Administrative staff access required");

    switch (req.user.role) {
      case "Student":
        return res.redirect("/dashboard/student");
      case "Lecturer":
        return res.redirect("/dashboard/lecturer");
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

/**
 * Middleware to check if user has completed profile
 * (For students with registration status)
 */
const ensureProfileComplete = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  // Only check for students
  if (req.user.role === "Student") {
    const registrationStatus =
      req.user.studentProfile?.registrationStatus || "Pending";

    if (
      registrationStatus === "Pending" ||
      registrationStatus === "In Progress"
    ) {
      req.flash("warning", "Please complete your profile registration first");
      return res.redirect("/student/complete-profile");
    }
  }

  next();
};

/**
 * Middleware to check if user has been approved/admitted
 * (For students with admission status)
 */
const ensureAdmissionApproved = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to access this page");
    return res.redirect("/login");
  }

  // Only check for students
  if (req.user.role === "Student") {
    const admissionStatus =
      req.user.studentProfile?.admissionStatus || "Applied";

    if (admissionStatus === "Applied") {
      req.flash("warning", "Your admission is still pending approval");
      return res.redirect("/student/dashboard");
    }
  }

  next();
};

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
  ensureRegistrar,
  ensureAdmissionsOfficer,
  ensureFinanceOfficer,
  ensureAcademicStaff,
  ensureAdministrativeStaff,
  ensureProfileComplete,
  ensureAdmissionApproved,
};
