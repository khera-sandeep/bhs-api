const express = require('express');
// const sharp = require('sharp')
const PaymentWebhook = require('../models/paymentwebhook');
const auth = require('../middleware/auth-local');
const router = new express.Router();
const authorizationMiddleware = require('../middleware/authorization');
const RoleEnum = require('../enums/roleenum');

router.post('/payment/webhook/razorpay/', async (req, res) => {
  try {
    const paymentWebhook = new PaymentWebhook();
    paymentWebhook.request = req.body;
    paymentWebhook.headers = req.headers;
    paymentWebhook.status = 'test';
    paymentWebhook.createdBy = req.user._id;
    await paymentWebhook.save();
    res.status(201).send();
  } catch (e) {
    console.log('Error while handling razpay webhook', e);
    res.status(400).send(e);
  }
});

module.exports = router;
