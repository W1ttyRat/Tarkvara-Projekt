const bookingController = require("../controllers/booking.controller");

const express = require("express");
const router = express.Router();

router.get("/api/bookings", bookingController.getAllBookings);
router.post("/api/bookings", bookingController.createBooking);
router.patch("/api/bookings/:id/cancel", bookingController.cancelReservation);

router.get("/booking", bookingController.getBookingPage);

router.post("/booking", bookingController.createBooking);

module.exports = router;