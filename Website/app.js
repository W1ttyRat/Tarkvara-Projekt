const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
//const errorHandler = require('./middleware/error.validate');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// load env vars
dotenv.config();


// create express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// configure helmet
app.use(helmet({
    contentSecurityPolicy: false,
}));

// configure CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // allow cookies
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

// Routes
// example route
const indexRoutes = require('./routes/index.routes');
app.use('/', indexRoutes);

const bookingRoutes = require("./routes/bookingRoutes");
app.use(express.urlencoded({ extended: true }));
app.use("/", bookingRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

const employeeRoutes = require('./routes/employee.routes');
app.use('/employee', employeeRoutes);

const bossRoutes = require('./routes/boss.routes');
app.use('/boss', bossRoutes);

// error handling middleware
//app.use(errorHandler);

// export app for testing or start server (server.js)

module.exports = app;