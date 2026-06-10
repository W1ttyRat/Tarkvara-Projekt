-- PostgreSQL schema for vehicle inspection booking system

DROP TABLE IF EXISTS unavailable_time CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS worker_shift CASCADE;
DROP TABLE IF EXISTS worker_licence_category CASCADE;
DROP TABLE IF EXISTS service CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS worker CASCADE;
DROP TABLE IF EXISTS licence_category CASCADE;
DROP TABLE IF EXISTS client CASCADE;

CREATE TABLE client (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30)
);

CREATE TABLE licence_category (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE vehicle (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INTEGER NOT NULL,
    licence_category_id INTEGER NOT NULL,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    vin VARCHAR(50),
    make VARCHAR(80),
    model VARCHAR(80),
    width_mm INTEGER,
    height_mm INTEGER,
    length_mm INTEGER,

    CONSTRAINT fk_vehicle_client
        FOREIGN KEY (client_id)
        REFERENCES client(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vehicle_licence_category
        FOREIGN KEY (licence_category_id)
        REFERENCES licence_category(id),

    CONSTRAINT chk_vehicle_width_positive
        CHECK (width_mm IS NULL OR width_mm > 0),

    CONSTRAINT chk_vehicle_height_positive
        CHECK (height_mm IS NULL OR height_mm > 0),

    CONSTRAINT chk_vehicle_length_positive
        CHECK (length_mm IS NULL OR length_mm > 0)
);

CREATE TABLE worker (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30)
);

CREATE TABLE worker_licence_category (
    worker_id INTEGER NOT NULL,
    licence_category_id INTEGER NOT NULL,

    PRIMARY KEY (worker_id, licence_category_id),

    CONSTRAINT fk_worker_category_worker
        FOREIGN KEY (worker_id)
        REFERENCES worker(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_worker_category_licence_category
        FOREIGN KEY (licence_category_id)
        REFERENCES licence_category(id)
        ON DELETE CASCADE
);

CREATE TABLE location (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255),
    door_width_mm INTEGER NOT NULL,
    door_height_mm INTEGER NOT NULL,

    CONSTRAINT chk_location_door_width_positive
        CHECK (door_width_mm > 0),

    CONSTRAINT chk_location_door_height_positive
        CHECK (door_height_mm > 0)
);

CREATE TABLE worker_shift (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    worker_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    CONSTRAINT fk_worker_shift_worker
        FOREIGN KEY (worker_id)
        REFERENCES worker(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_worker_shift_location
        FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_worker_shift_time
        CHECK (end_time > start_time)
);

CREATE TABLE service (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    required_licence_category_id INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10, 2),

    CONSTRAINT fk_service_required_licence_category
        FOREIGN KEY (required_licence_category_id)
        REFERENCES licence_category(id),

    CONSTRAINT chk_service_duration_positive
        CHECK (duration_minutes > 0),

    CONSTRAINT chk_service_price_positive
        CHECK (price IS NULL OR price >= 0)
);

CREATE TABLE reservation (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_client
        FOREIGN KEY (client_id)
        REFERENCES client(id),

    CONSTRAINT fk_reservation_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle(id),

    CONSTRAINT fk_reservation_worker
        FOREIGN KEY (worker_id)
        REFERENCES worker(id),

    CONSTRAINT fk_reservation_location
        FOREIGN KEY (location_id)
        REFERENCES location(id),

    CONSTRAINT fk_reservation_service
        FOREIGN KEY (service_id)
        REFERENCES service(id),

    CONSTRAINT chk_reservation_time
        CHECK (end_time > start_time),

    CONSTRAINT chk_reservation_status
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

CREATE TABLE unavailable_time (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    worker_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    reason TEXT,

    CONSTRAINT fk_unavailable_time_worker
        FOREIGN KEY (worker_id)
        REFERENCES worker(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_unavailable_time
        CHECK (end_time > start_time)
);

CREATE INDEX idx_vehicle_client_id ON vehicle(client_id);
CREATE INDEX idx_vehicle_licence_category_id ON vehicle(licence_category_id);

CREATE INDEX idx_worker_shift_worker_id ON worker_shift(worker_id);
CREATE INDEX idx_worker_shift_location_id ON worker_shift(location_id);
CREATE INDEX idx_worker_shift_time ON worker_shift(start_time, end_time);

CREATE INDEX idx_service_required_licence_category_id ON service(required_licence_category_id);

CREATE INDEX idx_reservation_client_id ON reservation(client_id);
CREATE INDEX idx_reservation_vehicle_id ON reservation(vehicle_id);
CREATE INDEX idx_reservation_worker_id ON reservation(worker_id);
CREATE INDEX idx_reservation_location_id ON reservation(location_id);
CREATE INDEX idx_reservation_service_id ON reservation(service_id);
CREATE INDEX idx_reservation_time ON reservation(start_time, end_time);

CREATE INDEX idx_unavailable_time_worker_id ON unavailable_time(worker_id);
CREATE INDEX idx_unavailable_time_time ON unavailable_time(start_time, end_time);

INSERT INTO licence_category (code, name) VALUES
('A', 'Mootorratas'),
('B', 'Sõiduauto'),
('BE', 'Sõiduauto haagisega'),
('C', 'Veoauto'),
('CE', 'Veoauto haagisega'),
('D', 'Buss');

-- Example services
INSERT INTO service (required_licence_category_id, name, duration_minutes, price)
SELECT id, 'B-kategooria sõiduki ülevaatus', 30, 40.00
FROM licence_category
WHERE code = 'B';

INSERT INTO service (required_licence_category_id, name, duration_minutes, price)
SELECT id, 'A-kategooria sõiduki ülevaatus', 30, 35.00
FROM licence_category
WHERE code = 'A';

INSERT INTO service (required_licence_category_id, name, duration_minutes, price)
SELECT id, 'CE-kategooria sõiduki ülevaatus', 45, 70.00
FROM licence_category
WHERE code = 'CE';
