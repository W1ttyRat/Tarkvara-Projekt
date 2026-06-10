const express = require("express");
const router = express.Router();

router.get("/booking", (req, res) => {
  res.render("pages/booking", {
    title: "Broneering",
    pageClass: "booking-page"
  });
});

router.post("/booking", (req, res) => {
  console.log(req.body);
  res.redirect("/booking");
});

module.exports = router;