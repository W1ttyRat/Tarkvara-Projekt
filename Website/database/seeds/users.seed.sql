-- Seed 20 test users
-- Note: These are hashed passwords using bcryptjs with "password123" as the plaintext
-- To generate your own: const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10)

-- ära kasuta neid andmeid, see on näidis

INSERT INTO users (first_name, last_name, username, password_hash, role, created_at) VALUES
('John', 'Admin', 'John Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'boss', NOW()),
('Jane', 'Admin', 'Jane Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'boss', NOW()),
('Alice', 'User', 'Alice User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Bob', 'User', 'Bob User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Charlie', 'User', 'Charlie User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Diana', 'User', 'Diana User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Eve', 'User', 'Eve User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Frank', 'User', 'Frank User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Grace', 'User', 'Grace User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Henry', 'User', 'Henry User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Ivy', 'User', 'Ivy User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Jack', 'User', 'Jack User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Kate', 'User', 'Kate User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Liam', 'User', 'Liam User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Mia', 'User', 'Mia User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Noah', 'User', 'Noah User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Olivia', 'User', 'Olivia User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Patrick', 'User', 'Patrick User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Quinn', 'User', 'Quinn User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW()),
('Ruby', 'User', 'Ruby User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'employee', NOW());