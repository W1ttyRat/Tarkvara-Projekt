const Booking = require('../models/booking.model');
const emailService = require('../services/email.service');

const serviceModel = require('../models/service.model');
const locationModel = require('../models/location.model');

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

        // validate start/end times before DB queries
        if (!start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Palun lisa algus- ja lõppkuupäev.' });
        }
        const startDt = new Date(start_time);
        const endDt = new Date(end_time);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
            return res.status(400).json({ success: false, message: 'Kuupäevade formaat on vigane.' });
        }
        if (endDt <= startDt) {
            return res.status(400).json({ success: false, message: 'Lõpp-aeg peab olema hilisem kui algusaeg.' });
        }

        // Server-side fit check: ensure vehicle fits selected location doors
        try {
            const fitResult = await Booking.checkVehicleFit(vehicle_id, location_id);
            if (!fitResult.fits) {
                return res.status(400).json({ success: false, message: fitResult.message });
            }
        } catch (err) {
            console.error('server-side fit check error', err);
            return res.status(500).json({ success: false, message: 'Serveri viga mõõtude kontrollimisel' });
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

        await emailService.sendBookingConfirmation(req.body.email, {
            name: req.body.client_name,
            registration_number: req.body.registration_number,
            location: req.body.location_name, 
            service: req.body.service_name, 
            start_time
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


// POST /api/check-fit
// body: { registration_number: string, locationId: number }
const checkFit = async (req, res) => {
    try {
        const registration_number_raw = req.body.registration_number || '';
        const registration_number = registration_number_raw.trim();
        const locationId = parseInt(req.body.locationId, 10);

        if (!registration_number) {
            return res.status(400).json({ fits: false, message: 'Sisesta registreerimisnumber.' });
        }
        if (isNaN(locationId)) {
            return res.status(400).json({ fits: false, message: 'Vali asukoht.' });
        }

        // use model method for fit check
        const fitResult = await Booking.checkVehicleFitByRegistration(registration_number, locationId);
        return res.json({ fits: fitResult.fits, message: fitResult.message || undefined });

    } catch (err) {
        console.error('checkFit error', err);
        return res.status(500).json({ fits: false, message: 'Serveri viga' });
    }
};

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
    getBookingPage,
    checkFit
};
