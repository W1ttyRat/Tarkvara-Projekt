const Booking = require('../models/booking.model');
const emailService = require('../services/email.service');
const serviceModel = require('../models/service.model');
const locationModel = require('../models/location.model');

const BOOKING_DURATION_MINUTES = 45;

const addMinutesToDateTimeLocal = (value, minutes) => {
    const [datePart, timePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);

    const pad = (n) => String(n).padStart(2, '0');

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('-') + 'T' + [
        pad(date.getHours()),
        pad(date.getMinutes())
    ].join(':');
};

const getSlotWindow = (rawStartTime) => {
    if (!rawStartTime || typeof rawStartTime !== 'string') {
        return null;
    }

    const startValue = rawStartTime.trim();
    if (!startValue) {
        return null;
    }

    const endValue = addMinutesToDateTimeLocal(startValue, BOOKING_DURATION_MINUTES);
    return { startValue, endValue };
};

const getAllBookings = async (req, res, next) => {
    try {
        const rows = await Booking.getAllBookings();
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return next(error);
    }
};

const createBooking = async (req, res, next) => {
    try {
        let client_id = parseInt(req.body.client_id, 10);
        let vehicle_id = parseInt(req.body.vehicle_id, 10);
        const location_id = parseInt(req.body.location_id, 10);
        const service_id = parseInt(req.body.service_id, 10);
        const registration_number = (req.body.registration_number || '').trim();
        const { start_time, comment } = req.body;
        
        // Vehicle handling
        if (isNaN(vehicle_id)) {
            if (!registration_number) {
                return res.status(400).json({
                     success: false, 
                     message: 'Sõiduki registreerimisnumber puudub.' 
                });
            }

            const found = await Booking.findVehicleByRegistration(registration_number);
            if (!found) {
                return res.status(400).json({
                    success: false,
                    message: 'Sõidukit ei leitud andmebaasist. Kasutage olemasolevat registreerimisnumbrit.'
                });
            }

            vehicle_id = found.id;
        }

        // Client handling
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

        // Validate all IDs are numbers
        if ([client_id, vehicle_id, service_id, location_id].some(isNaN)) {
            return res.status(400).json({
                success: false,
                message: 'Vigased andmed. Kõik ID-väärtused peavad olema numbrid!'
            });
        }

        // Validate start_time
        if (!start_time || typeof start_time !== 'string' || !start_time.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Palun lisa alguskuupäev.' 
            });
        }

        const slotWindow = getSlotWindow(start_time);
        if (!slotWindow) {
            return res.status(400).json({ success: false, message: 'Kuupäeva formaat on vigane.' });
        }

        const { startValue, endValue } = slotWindow;

        try {
            const fitResult = await Booking.checkVehicleFit(vehicle_id, location_id);
            if (!fitResult.fits) {
                return res.status(400).json({ success: false, message: fitResult.message });
            }
        } catch (err) {
            console.error('server-side fit check error', err);
            return res.status(500).json({ success: false, message: 'Serveri viga mõõtude kontrollimisel' });
        }

        const availability = await Booking.getStaffingAvailability({
            locationId: location_id,
            serviceId: service_id,
            startTime: startValue,
            endTime: endValue
        });

        if (!availability.available) {
            const diagnostics = ` (sobivad tootajad: ${availability.qualifiedWorkers}, kattuvad broneeringud: ${availability.overlappingReservations})`;
            return res.status(400).json({
                success: false,
                message: (availability.message || 'Valitud aeg ei ole saadaval.') + diagnostics
            });
        }
        const created = await Booking.createReservation({
            client_id,
            vehicle_id,
            location_id,
            service_id,
            start_time: startValue,
            end_time: endValue,
            comment
        });

        // Send confirmation email
        if (req.body.email) {
            await emailService.sendBookingConfirmation(req.body.email, {
                name: req.body.client_name,
                registration_number: req.body.registration_number,
                location: req.body.location_name,
                service: req.body.service_name,
                start_time
            }).catch(err => console.error('Email sending failed:', err));
        }

        return res.status(201).json({
            success: true,
            message: 'Broneering edukalt loodud!',
            data: created
        });
    } catch (error) {
        return next(error);
    }
};


const cancelReservation = async (req, res, next) => {
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
        return next(error);
    }
};


// POST /api/check-fit
// body: { registration_number: string, locationId: number }
const checkFit = async (req, res, next) => {
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
        return next(err);
    }
};

// POST /api/check-availability
// body: { locationId: number, serviceId: number, start_time: string }
const checkAvailability = async (req, res, next) => {
    try {
        const locationId = parseInt(req.body.locationId, 10);
        const serviceId = parseInt(req.body.serviceId, 10);
        const slotWindow = getSlotWindow(req.body.start_time);

        if (isNaN(locationId)) {
            return res.status(400).json({ available: false, message: 'Vali asukoht.' });
        }

        if (isNaN(serviceId)) {
            return res.status(400).json({ available: false, message: 'Vali teenus.' });
        }

        if (!slotWindow) {
            return res.status(400).json({ available: false, message: 'Vali korrektne algusaeg.' });
        }

        const availability = await Booking.getStaffingAvailability({
            locationId,
            serviceId,
            startTime: slotWindow.startValue,
            endTime: slotWindow.endValue
        });

        return res.json(availability);
    } catch (err) {
        return next(err);
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
    checkFit,
    checkAvailability
};
