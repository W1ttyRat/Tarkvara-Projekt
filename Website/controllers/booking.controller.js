const Booking = require('../models/booking.model');

const getAllBookings = async (req, res) => {
    try {
        const rows = await Booking.getAllBookings();
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// DB access delegated to models/Booking

const createBooking = async (req, res) => {
    try {
        let client_id = parseInt(req.body.client_id, 10);
        // require registration_number to map to existing vehicle
        const registration_number_raw = req.body.registration_number || '';
        const registration_number = registration_number_raw.trim();
        console.log('createBooking registration_number:', JSON.stringify(registration_number_raw), '->', JSON.stringify(registration_number));

        let vehicle_id = parseInt(req.body.vehicle_id, 10);
        if (isNaN(vehicle_id)) {
            if (!registration_number) {
                return res.status(400).json({ success: false, message: 'Sõiduki registreerimisnumber puudub.' });
            }
            const found = await Booking.findVehicleByRegistration(registration_number);
            if (!found) {
                return res.status(400).json({ success: false, message: 'Sõidukit ei leitud andmebaasist. Kasutage olemasolevat registreerimisnumbrit.' });
            }
            vehicle_id = found.id;
        }
        const location_id = parseInt(req.body.location_id, 10);
        const service_id = parseInt(req.body.service_id, 10);
        const { start_time, end_time, comment } = req.body;

        // If client_id not provided, create client from form fields via model
        if (isNaN(client_id)) {
            const client_name = req.body.client_name;
            const phone = req.body.phone;
            const email = req.body.email;

            if (!client_name) {
                return res.status(400).json({ success: false, message: 'Missing client_name' });
            }

            const client = await Booking.createClient({ name: client_name, email, phone });
            client_id = client.id;
        }

        if (isNaN(client_id) || isNaN(vehicle_id) || isNaN(service_id) || isNaN(location_id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vigased andmed. Kõik ID-väärtused peavad olema numbrid!' 
            });
        }

        // Topelt broneeringu kontroll via model
        const overlaps = await Booking.checkOverlap(start_time, end_time);

        if (overlaps.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'See töötaja on valitud ajavahemikus juba hõivatud!' 
            });
        }

        const created = await Booking.createReservation({
            client_id,
            vehicle_id,
            location_id,
            service_id,
            start_time,
            end_time,
            comment
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Broneering edukalt loodud!',
            data: created
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const reservationId = parseInt(req.params.id, 10); // ID tuleb URL-ist (nt /api/reservations/5/cancel)

        if (isNaN(reservationId)) {
            return res.status(400).json({ success: false, message: 'Vigane broneeringu ID.' });
        }

        const cancelled = await Booking.cancelReservation(reservationId);

        if (!cancelled) {
            return res.status(404).json({ 
                success: false, 
                message: 'Broneeringut ei leitud või see on juba tühistatud.' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Broneering edukalt tühistatud.', 
            data: cancelled 
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const serviceModel = require('../models/service.model');
const locationModel = require('../models/location.model');

const getBookingPage = async (req, res, next) => {
    try {
        const service = await serviceModel.getAllServices();
        const location = await locationModel.getAllLocations();

        res.render('booking/booking', {
            title: 'Broneering',
            pageClass: 'booking-page',
            service,
            location,            // keep singular for existing template
            locations: location, // also expose plural for client JS
            csrfToken: req.csrfToken ? req.csrfToken() : null
        });
    } catch (err) {
        return next(err);
    }
};
module.exports = {
    getAllBookings,
    createBooking,
    cancelReservation,
    getBookingPage
};
