const Booking = require('../models/Booking');

const getAllBookings = async (req, res) => {
    try {
        const rows = await Booking.getAllBookings();
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const client_id = parseInt(req.body.client_id, 10);
        const vehicle_id = parseInt(req.body.vehicle_id, 10);
        const location_id = parseInt(req.body.location_id, 10);
        const service_id = parseInt(req.body.service_id, 10);
        const { start_time, end_time, comment } = req.body;

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

exports.cancelReservation = async (req, res) => {
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

exports.getAllBookings = getAllBookings;