const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const memberRouter = require('./routers/member');
const cors = require('cors');
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGIN,
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        allowedHeaders: ['Content-Type','Authorization','Cache-Control', 'Pragma', 'Expires']
    })
);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter)
app.options('*', cors());
app.use(memberRouter);
app.use(userRouter);

module.exports = app;
