-- Seed 20 test users
-- Note: These are hashed passwords using bcryptjs with "password123" as the plaintext
-- To generate your own: const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10)

-- ära kasuta neid andmeid, see on näidis

INSERT INTO users (first_name, last_name, username, password_hash, role, created_at) VALUES
('John', 'Admin', 'john.admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'admin', NOW()),
('Jane', 'Admin', 'jane.admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'admin', NOW()),
('Alice', 'User', 'alice.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Bob', 'User', 'bob.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Charlie', 'User', 'charlie.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Diana', 'User', 'diana.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Eve', 'User', 'eve.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Frank', 'User', 'frank.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Grace', 'User', 'grace.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Henry', 'User', 'henry.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Ivy', 'User', 'ivy.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Jack', 'User', 'jack.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Kate', 'User', 'kate.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Liam', 'User', 'liam.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Mia', 'User', 'mia.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Noah', 'User', 'noah.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Olivia', 'User', 'olivia.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Patrick', 'User', 'patrick.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Quinn', 'User', 'quinn.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW()),
('Ruby', 'User', 'ruby.user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZyWsIS', 'user', NOW());