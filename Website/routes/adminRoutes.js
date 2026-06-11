const express = require("express");
const router = express.Router();

router.get("/admin", (req, res) => {
  res.render("pages/admin", {
    title: "Admin",
    pageClass: "admin-page",

    bookings: [
      {
        time: "10:00",
        client: "Mari Maasikas",
        vehicle: "123ABC",
        service: "B-kategooria ülevaatus",
        status: "confirmed"
      }
    ],

    shifts: [
      {
        date: "2026-06-10",
        location: "Tallinn",
        start: "09:00",
        end: "17:00"
      }
    ],

    categories: ["B", "BE", "CE"]
  });
});

module.exports = router;

router.get("/admin/schedule", (req, res) => {
  res.render("pages/adminSchedule", {
    title: "Töötaja kalendrivaade",
    pageClass: "admin-schedule-page",
    locations: [
      { id: 1, name: "Tallinn" },
      { id: 2, name: "Tartu" },
      { id: 3, name: "Pärnu" }
    ]
  });
});

router.post("/admin/schedule", (req, res) => {
  console.log(req.body);
  res.redirect("/admin/schedule");
});