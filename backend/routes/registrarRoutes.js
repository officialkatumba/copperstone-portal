// // const express = require("express");
// // const router = express.Router();
// // const { isRegistrar } = require("../middleware/auth");
// // const {
// //   getCreateGroup,
// //   createGroup,
// //   listGroups,
// //   viewGroup,
// //   updateGroup,
// //   addStudentToGroup,
// //   removeStudentFromGroup,
// //   changeGroupStatus,
// //   deleteGroup,
// // } = require("../controllers/registrarController");

// // // TEMPORARY: Test route without middleware
// // router.get("/test-group-create", (req, res) => {
// //   res.send("Test route working!");
// // });

// // // Apply registrar middleware to all routes
// // router.use(isRegistrar);

// // // Group Management Routes
// // router.get("/groups/create", getCreateGroup);
// // router.post("/groups/create", createGroup);
// // router.get("/groups", listGroups);
// // router.get("/groups/:id", viewGroup);
// // router.post("/groups/:id/update", updateGroup);
// // router.post("/groups/:id/add-student", addStudentToGroup);
// // router.post("/groups/:id/remove-student/:studentId", removeStudentFromGroup);
// // router.post("/groups/:id/status", changeGroupStatus);
// // router.post("/groups/:id/delete", deleteGroup);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { ensureRegistrar } = require("../middleware/auth"); // Changed from isRegistrar
// const {
//   getCreateGroup,
//   createGroup,
//   listGroups,
//   viewGroup,
//   updateGroup,
//   addStudentToGroup,
//   removeStudentFromGroup,
//   changeGroupStatus,
//   deleteGroup,
// } = require("../controllers/registrarController");

// // Apply registrar middleware to all routes
// // router.use(ensureRegistrar); // Changed from isRegistrar

// // Test route without middleware
// router.get("/test-create", async (req, res) => {
//   try {
//     const programmes = await Programme.find({ isActive: true });
//     res.render("registrar/create-group", {
//       title: "Create Academic Group - Test",
//       programmes,
//       courses: [],
//       lecturers: [],
//       user: req.user,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.send("Error: " + error.message);
//   }
// });

// // Group Management Routes
// router.get("/groups/create", getCreateGroup);
// router.post("/groups/create", createGroup);
// router.get("/groups", listGroups);
// router.get("/groups/:id", viewGroup);
// router.post("/groups/:id/update", updateGroup);
// router.post("/groups/:id/add-student", addStudentToGroup);
// router.post("/groups/:id/remove-student/:studentId", removeStudentFromGroup);
// router.post("/groups/:id/status", changeGroupStatus);
// router.post("/groups/:id/delete", deleteGroup);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { ensureRegistrar } = require("../middleware/auth");
const Programme = require("../models/Programme");

const {
  getCreateGroup,
  createGroup,
  listGroups,
  viewGroup,
  updateGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  changeGroupStatus,
  deleteGroup,
} = require("../controllers/registrarController");

// 🔐 Protect all registrar routes
// router.use(ensureRegistrar);

router.use((req, res, next) => {
  console.log("AUTH CHECK:", {
    isAuth: req.isAuthenticated(),
    user: req.user?.role,
  });
  next();
});

// Group Management
router.get("/groups/create", getCreateGroup);
router.post("/groups/create", createGroup);
router.get("/groups", listGroups);
router.get("/groups/:id", viewGroup);
router.post("/groups/:id/update", updateGroup);
router.post("/groups/:id/add-student", addStudentToGroup);
router.post("/groups/:id/remove-student/:studentId", removeStudentFromGroup);
router.post("/groups/:id/status", changeGroupStatus);
router.post("/groups/:id/delete", deleteGroup);

module.exports = router;
