const express = require('express');
// const sharp = require('sharp')
const PaymentWebhook = require('../models/paymentwebhook');
const router = new express.Router();
const Payment = require("../models/payments");
const UserRegistration = require("../models/userregistration");
const {verifyWebhookSignature} = require("../payments/providers/razorpay");

/**
 * Method to process webhook event from razorpay
 * @param razPayPayment
 * @param payment
 * @param userRegistration
 * @param req
 * @returns {Promise<void>}
 */
async function processWebhookEvent(razPayPayment, payment, userRegistration, req, paymentwebhook) {
  try {
    console.log('Processing payment webhook event from razorpay {}', razPayPayment, razPayPayment.id, payment._id, userRegistration._id);
    if (req.body.event === 'payment.failed') {
      await userRegistration.updatePaymentStatus(payment, razPayPayment.status, razPayPayment.error_code, null);
    } else if (req.body.event === 'payment.captured') {
      await userRegistration.updatePaymentStatus(payment, razPayPayment.status, 'Payment captured', null);
    } else if (req.body.event === 'payment.authorized') {
      if (payment.status !== 'captured' || payment.status !== 'failed' || payment.status !== 'refunded') {
        await userRegistration.updatePaymentStatus(payment, razPayPayment.status, 'Payment authorized', null);
      }
    } else if (req.body.event === 'refund.created') {
      payment.refundId = req.body.payload.refund.entity.id;
      await userRegistration.updatePaymentStatus(payment, 'refunded', 'Payment refunded', null);
    } else {
      console.log('Event not handled {}', req.body.event);
    }
    paymentwebhook.status = 'processed';
  } catch (e) {
    console.error('Error while processing webhook event from razorpay', e);
    paymentwebhook.status = 'failed';
  } finally {
    await paymentwebhook.save();
  }
}

router.post('/payment/webhook/razorpay/', async (req, res) => {
  console.log('Processing webhook event from razorpay {}', req.body);
  let userRegistration;
  let payment;
  let razPayPayment;
  try {
    razPayPayment = req.body.payload.payment.entity;
    const paymentWebhook = new PaymentWebhook();
    paymentWebhook.request = req.body;
    paymentWebhook.headers = req.headers;
    console.log('Verifying signature for webhook event from razorpay {}', req.headers['x-razorpay-signature']);
    let isSignatureValid = verifyWebhookSignature(JSON.stringify(req.body), req.headers['x-razorpay-signature']);
    console.log('Signature verification status : ', isSignatureValid);
    /*
    find payment object in the system
     */
    payment = await Payment.findOne({'paymentResponse.id': razPayPayment.id});
    if (!payment) {
      console.log('Payment not found for webhook event {}', req.body);
      throw new Error('Payment not found for webhook event');
    }
    userRegistration = UserRegistration.findOne({_id: payment.registration});
    if (!userRegistration) {
      console.log('User registration not found for payment {}', payment._id, payment.registration, req.body);
      throw new Error('User registration not found for payment');
    }
    console.log('Persisting payment webhook event from razorpay', razPayPayment.id, payment._id, userRegistration._id, razPayPayment.status);
    await paymentWebhook.save();
    /*
    Processing webhook event.
     */
    await processWebhookEvent(razPayPayment, payment, userRegistration, req, paymentWebhook);
    res.status(200).send();
  } catch (e) {
    console.log('Error while handling razpay webhook', e);
    res.status(400).send(e);
  }
});

module.exports = router;
