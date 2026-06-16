const bookingController = require("../controllers/booking.controller");

const express = require("express");
const router = express.Router();

const { bookingLimiter } = require("../middleware/rateLimiter.middleware");

router.get("/api/bookings", bookingController.getAllBookings);
router.post("/api/bookings", bookingLimiter, bookingController.createBooking);
router.post('/api/check-fit', bookingLimiter, bookingController.checkFit);
router.patch("/api/bookings/:id/cancel", bookingController.cancelReservation);

router.get("/booking", bookingController.getBookingPage);

router.post("/booking", bookingLimiter, bookingController.createBooking);

module.exports = router;