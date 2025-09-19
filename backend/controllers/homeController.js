// backend/controllers/homeController.js

exports.getHome = (req, res) => {
  res.render("home", { title: "Copperstone Portal" });
};
