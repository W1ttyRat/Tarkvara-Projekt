const db = require('../config/db');

const getAllBookings = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM reservation');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const client_id = parseInt(req.body.client_id, 10);
        const vehicle_id = parseInt(req.body.vehicle_id, 10);
        const worker_id = parseInt(req.body.worker_id, 10);
        const location_id = parseInt(req.body.location_id, 10);
        const service_id = parseInt(req.body.service_id, 10);
        const { start_time, end_time, comment } = req.body;

        if (isNaN(client_id) || isNaN(vehicle_id) || isNaN(worker_id) || isNaN(service_id) || isNaN(location_id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vigased andmed. Kõik ID-väärtused peavad olema numbrid!' 
            });
        }

        // Topelt broneeringu kontroll
        const checkQuery = `
            SELECT * FROM reservation 
            WHERE worker_id = $1 
              AND status != 'cancelled'
              AND start_time < $3 
              AND end_time > $2;
        `;
        
        const checkResult = await db.query(checkQuery, [worker_id, start_time, end_time]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'See töötaja on valitud ajavahemikus juba hõivatud!' 
            });
        }

        const insertQuery = `
            INSERT INTO reservation (client_id, vehicle_id, worker_id, location_id, service_id, start_time, end_time, status, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8)
            RETURNING *;
        `;
        
        const newReservation = await db.query(insertQuery, [
            client_id, 
            vehicle_id, 
            worker_id, 
            location_id, 
            service_id, 
            start_time, 
            end_time, 
            comment
        ]);

        return res.status(201).json({ 
            success: true, 
            message: 'Broneering edukalt loodud!',
            data: newReservation.rows[0] 
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

        const updateQuery = `
            UPDATE reservation 
            SET status = 'cancelled' 
            WHERE id = $1 AND status != 'cancelled'
            RETURNING *;
        `;

        const result = await db.query(updateQuery, [reservationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Broneeringut ei leitud või see on juba tühistatud.' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Broneering edukalt tühistatud.', 
            data: result.rows[0] 
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};