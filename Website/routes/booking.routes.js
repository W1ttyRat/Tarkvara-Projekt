const bookingController = require("../controllers/booking.controller");

const express = require("express");
const router = express.Router();

const { bookingLimiter } = require("../middleware/rateLimiter.middleware");

router.get("/api/bookings", bookingController.getAllBookings);
router.get("/booking", bookingController.getBookingPage);
router.get("/booking/service", bookingController.getServiceStep);
router.get("/booking/time", bookingController.getTimeStep);
router.get("/booking/contact", bookingController.getContactStep);
router.get("/booking/success", bookingController.getSuccessPage);
router.post("/api/bookings", bookingLimiter, bookingController.createBooking);
router.post('/api/check-fit', bookingLimiter, bookingController.checkFit);
router.post('/api/check-availability', bookingLimiter, bookingController.checkAvailability);
router.patch("/api/bookings/:id/cancel", bookingController.cancelReservation);
router.post(
    "/booking/vehicle",
    bookingLimiter,
    bookingController.saveVehicleStep
);
router.post(
    "/booking/service",
    bookingLimiter,
    bookingController.saveServiceStep
);
router.post(
    "/booking/time",
    bookingLimiter,
    bookingController.saveTimeStep
);
router.post(
    "/booking/contact",
    bookingLimiter,
    bookingController.saveContactStep
);

router.get("/booking", bookingController.getBookingPage);

router.post("/booking", bookingLimiter, bookingController.createBooking);

module.exports = router;