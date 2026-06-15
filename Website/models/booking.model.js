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
        // return the vehicle row (id + dims) to allow callers to use dimensions if needed
        return await this.getVehicleByRegistration(registration_number);
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
    // Helper: get vehicle by id
    async getVehicleById(vehicleId) {
        const res = await this.pool.query(
            `SELECT id, width_mm, height_mm, length_mm FROM vehicle WHERE id = $1 LIMIT 1`,
            [vehicleId]
        );
        return res.rows[0] || null;
    }

    // Helper: get vehicle by registration
    async getVehicleByRegistration(registration_number) {
        const res = await this.pool.query(
            `SELECT id, width_mm, height_mm, length_mm FROM vehicle WHERE UPPER(TRIM(registration_number)) = UPPER(TRIM($1)) LIMIT 1`,
            [registration_number]
        );
        return res.rows[0] || null;
    }

    // Helper: get location by id
    async getLocationById(locationId) {
        const res = await this.pool.query(
            `SELECT id, door_width_mm, door_height_mm FROM location WHERE id = $1 LIMIT 1`,
            [locationId]
        );
        return res.rows[0] || null;
    }

    // Consolidated fit check using vehicle and location objects
    _evaluateFit(vehicle, location) {
        if (!vehicle) return { fits: false, message: 'Sõidukit ei leitud.' };
        if (!location) return { fits: false, message: 'Asukohta ei leitud.' };
        if (vehicle.width_mm == null || vehicle.height_mm == null) return { fits: false, message: 'Sõiduki mõõtmed pole andmebaasis.' };

        const fitsWidth = vehicle.width_mm <= location.door_width_mm;
        const fitsHeight = vehicle.height_mm <= location.door_height_mm;
        if (!fitsWidth || !fitsHeight) {
            const reasons = [];
            if (!fitsWidth) reasons.push('laius');
            if (!fitsHeight) reasons.push('kõrgus');
            return { fits: false, message: `Auto ei mahu: ${reasons.join(', ')}` };
        }
        return { fits: true, message: null };
    }

    async checkVehicleFit(vehicleId, locationId) {
        const vehicle = await this.getVehicleById(vehicleId);
        const location = await this.getLocationById(locationId);
        return this._evaluateFit(vehicle, location);
    }

    async checkVehicleFitByRegistration(registration_number, locationId) {
        const vehicle = await this.getVehicleByRegistration(registration_number);
        const location = await this.getLocationById(locationId);
        return this._evaluateFit(vehicle, location);
    }
}

module.exports = new BookingModel(pool);