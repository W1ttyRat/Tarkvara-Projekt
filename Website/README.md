# Tarkvara-Projekt — Website

Professional web application for booking inspections and managing staff schedules. This repository contains the server-rendered Node.js/Express application that provides booking flows, authentication, boss/employee schedule management and the web UI assets.

## Table of Contents
- Project overview
- Features
- Tech stack
- Installation
- Configuration
- Database
- Running the app
- File tree (overview)
- Testing
- Contributing
- License

## Project overview

The `Website` project is a server-rendered web application using EJS templates, a PostgreSQL-backed data layer, and an Express server. It supports user authentication (access + refresh tokens), booking management, and schedule administration for bosses and employees.

## Features

- User authentication (login/register) with JWT access & refresh tokens
- Booking creation and availability checks
- Boss and employee schedule management UI
- Email notifications (via service integration)
- Rate limiting and error handling middleware

## Tech stack

- Node.js (18+ recommended)
- Express
- EJS for server-side views
- PostgreSQL
- Vanilla JavaScript for client-side interactions

## Installation

1. Clone the repo and change into the `Website` directory.

```bash
git clone <repo-url>
cd Tarkvara-Projekt/Website
npm install
```

2. Create a `.env` file with the minimum environment variables (see Configuration).

## Configuration

Create a `.env` file at the project root with at least the following values:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
NODE_ENV=development
PORT=3000
```

Refer to `config/db.js` for exact DB env var usage.

## Database

This project expects a PostgreSQL database. The SQL schema is available under `database/schemas/db.sql`. Create the database and run the schema script or use your preferred migration tool to create the required tables (`users`, `worker`, `location`, `service`, `reservation`, `worker_shift`, `refresh_tokens`, etc.).

## Running the app

Start the server:

```bash
node server.js
# or with nodemon
npx nodemon server.js
```

The server listens on `PORT` (default `3000`). Open `http://localhost:3000`.

## File tree (overview)

Top-level layout (abridged):

```
.
├─ app.js
├─ server.js
├─ package.json
├─ config/
│  └─ db.js
├─ controllers/
├─ models/
├─ routes/
├─ services/
├─ middleware/
├─ public/ (static assets)
├─ views/ (EJS templates)
├─ database/schemas/db.sql
└─ tests/
```

For a full listing, explore the repository. Key files:

- `app.js` — Express app configuration (security middleware, csurf, routes)
- `server.js` — server entry point
- `config/db.js` — PostgreSQL pool configuration
- `controllers/` — request handlers
- `models/` — DB layer and queries
- `public/js/` — client-side JS used by booking and schedule pages

## Testing

There are test stubs under `tests/`. To add automated tests, export the Express `app` from `app.js` and use a test runner (Jest/Mocha) with a test database.

## Contributing

- Fork the repository and create a feature branch.
- Add or update tests where applicable.
- Open a pull request with a clear description of changes.

## License

See the `LICENSE` file at the repository root.


