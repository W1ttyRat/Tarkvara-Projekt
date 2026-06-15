const pool = require("../config/db");

class BookingModel {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    async getAllBookings() {
        const query = 'SELECT * FROM reservation';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async checkOverlap(startTime, endTime) {
        const query = `
            SELECT * FROM reservation
            WHERE status != 'cancelled'
              AND start_time < $2
              AND end_time > $1
        `;
        const result = await this.pool.query(query, [startTime, endTime]);
        return result.rows;
    }

    async createReservation({ client_id, vehicle_id, location_id, service_id, start_time, end_time, comment }) {
        const query = `
            INSERT INTO reservation (client_id, vehicle_id, location_id, service_id, start_time, end_time, status, comment)
            VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7)
            RETURNING *
        `;
        const values = [client_id, vehicle_id, location_id, service_id, start_time, end_time, comment];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async createClient({ name, email, phone }) {
        // Try to find exact duplicate first (match NULLs too)
        const findQuery = `
            SELECT * FROM client
            WHERE name = $1
              AND email IS NOT DISTINCT FROM $2
              AND phone IS NOT DISTINCT FROM $3
            LIMIT 1
        `;
        const findRes = await this.pool.query(findQuery, [name, email || null, phone || null]);
        if (findRes.rows.length > 0) {
            return findRes.rows[0];
        }

        const insertQuery = `
            INSERT INTO client (name, email, phone)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [name, email || null, phone || null];
        const result = await this.pool.query(insertQuery, values);
        return result.rows[0];
    }

    async findVehicleByRegistration(registration_number) {
        const query = `
            SELECT id FROM vehicle
            WHERE UPPER(TRIM(registration_number)) = UPPER(TRIM($1))
            LIMIT 1
        `;
        const result = await this.pool.query(query, [registration_number]);
        return result.rows[0] || null;
    }

    async cancelReservation(reservationId) {
        const query = `
            UPDATE reservation
            SET status = 'cancelled'
            WHERE id = $1 AND status != 'cancelled'
            RETURNING *
        `;
        const result = await this.pool.query(query, [reservationId]);
        return result.rows[0];
    }

    async getBookingsForDate(date) {
        const query = `
            SELECT
                r.id,
                TO_CHAR(r.start_time, 'HH24:MI') AS time,
                c.name AS client,
                v.registration_number AS vehicle,
                s.name AS service,
                r.status
            FROM reservation r
            JOIN client c ON r.client_id = c.id
            JOIN vehicle v ON r.vehicle_id = v.id
            JOIN service s ON r.service_id = s.id
            WHERE r.start_time >= $1::date
              AND r.start_time < ($1::date + INTERVAL '1 day')
            ORDER BY r.start_time
        `;
        const { rows } = await this.pool.query(query, [date]);
        return rows;
    }

    async getBookingsForDashboard({ date, city = null, address = null, categoryId = null }) {
        const values = [date];
        let where = `
        WHERE r.start_time >= $1::date
          AND r.start_time < ($1::date + INTERVAL '1 day')
    `;

        if (city) {
            values.push(city);
            where += ` AND l.city = $${values.length}`;
        }

        if (address) {
            values.push(address);
            where += ` AND l.address = $${values.length}`;
        }

        if (categoryId) {
            values.push(categoryId);
            where += ` AND lc.id = $${values.length}`;
        }

        const query = `
        SELECT
            r.id,
            TO_CHAR(r.start_time, 'HH24:MI') AS time,
            c.name AS client,
            v.registration_number AS vehicle,
            s.name AS service,
            l.city,
            l.address,
            lc.name AS category_name,
            r.status
        FROM reservation r
        JOIN client c ON r.client_id = c.id
        JOIN vehicle v ON r.vehicle_id = v.id
        JOIN location l ON r.location_id = l.id
        JOIN service s ON r.service_id = s.id
        JOIN licence_category lc ON s.required_licence_category_id = lc.id
        ${where}
        ORDER BY r.start_time
    `;

        const { rows } = await this.pool.query(query, values);
        return rows;
    }
}

module.exports = new BookingModel(pool);