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
}

module.exports = new BookingModel(pool);