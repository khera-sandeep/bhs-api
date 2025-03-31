const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const memberRouter = require('./routers/member');
const termVersionRouter = require('./routers/termversion');
const userRegistrationRouter = require('./routers/userregistration');
const paymentWebhookRouter = require('./routers/payment');
const cors = require('cors');
const rateLimit = require("express-rate-limit");
const path = require('path');

const app = express();

// app.use((req, res, next) => {
//     try{
//         if(req.originalUrl && req.originalUrl.includes('/payment/webhook/razorpay/')){
//             console.log(`Request to: ${req.method} ${req.originalUrl}`);
//
//              console.log('Headers:', req.headers);
//             console.log('Body:', req.body); // Note: This will be empty before body-parser runs
//
//             // Capture raw body for debugging
//             let data = '';
//             req.on('data', chunk => {
//                 data += chunk;
//             });
//
//             req.on('end', () => {
//                 console.log('Raw body:', data);
//                 // Continue with normal request processing
//             });
//         }
//     }catch (e){
//         console.log('Error in logging middleware', e);
//     }
//     next();
// });

app.use(express.json({ limit: '15mb' }));
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGIN,
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        allowedHeaders: ['Content-Type','Authorization','Cache-Control', 'Pragma', 'Expires']
    })
);
const limiter = rateLimit({
    windowMs: 60 * 1000,
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
app.use(termVersionRouter);
app.use(userRegistrationRouter);
app.use(paymentWebhookRouter);


// Serve images from a specific folder
app.use('/images', express.static(path.join(__dirname, '/assets/images')));

module.exports = app;
