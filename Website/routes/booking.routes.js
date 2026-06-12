const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.contoller");


router.get("/api/bookings", bookingController.getAllBookings);
router.post("/api/bookings", bookingController.createBooking);
router.patch("/api/bookings/:id/cancel", bookingController.cancelReservation);


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