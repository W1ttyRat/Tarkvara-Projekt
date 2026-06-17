const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const helmet = require('helmet');
const crypto = require('crypto');
const errorHandler = require('./middleware/error.middleware');
const session = require("express-session");


// load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}

// create express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-later",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    }
}));

// configure CORS before csurf so preflight/headers are set
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // allow cookies
}));

// Create a per-request nonce for inline scripts allowed by CSP.
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});

// configure csurf with secure cookies in production
app.use(csurf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' } }));

// expose token to EJS views
app.use((req, res, next) => {
    try {
        res.locals.csrfToken = req.csrfToken();
    } catch (err) {
        // if no csurf set for route, ignore
        res.locals.csrfToken = null;
    }
    next();
});

// endpoint for AJAX clients to fetch token if needed (e.g. React frontend)
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

/* if (process.env.NODE_ENV === 'production') {
    // redirect HTTP to HTTPS
    app.use((req, res, next) => {
        if (req.secure) return next();
        res.redirect(`https://${req.headers.host}${req.url}`);
    });

    // configure HSTS
    app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
} */

// configure helmet
//app.use(helmet({
//    contentSecurityPolicy: false,
//}));
// configure helmet with a strict Content Security Policy that allows only same-origin assets
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}));

// configure morgan for logging
// 'dev' format shows: METHOD URL STATUS RESPONSE_TIME
app.use(morgan('dev'));

// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// configure ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(ejsLayouts);
app.set('layout', 'layouts/main'); // default layout

const { setCurrentUser } = require('./middleware/auth.middleware');
app.use(setCurrentUser); // set req.user if access token is valid

// Routes
// example route
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

const bookingRoutes = require('./routes/booking.routes');
app.use("/", bookingRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

const employeeRoutes = require('./routes/employee.routes');
app.use('/employee', employeeRoutes);

const bossRoutes = require('./routes/boss.routes');
app.use('/boss', bossRoutes);

// Browsers auto-request favicon.ico. Return 204 if no icon file is present.
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.use((req, res, next) => {
    const err = new Error(`Not found - ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
});

// error handler for CSRF to return JSON for API routes
app.use((err, req, res, next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
        }
        return res.status(403).send('Form tampered with');
    }
    next(err);
});
//ajutine
app.use((err, req, res, next) => {
    console.error("ERROR:", err);
    console.error("MESSAGE:", err.message);
    console.error("STACK:", err.stack);
    next(err);
});

//error handling middleware
app.use(errorHandler);

// export app for testing or start server (server.js)
module.exports = app;