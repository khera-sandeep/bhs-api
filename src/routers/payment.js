const express = require('express');
// const sharp = require('sharp')
const PaymentWebhook = require('../models/paymentwebhook');
const router = new express.Router();
const Payment = require("../models/payments");
const UserRegistration = require("../models/userregistration");
const User = require("../models/user");
const {verifyWebhookSignature} = require("../payments/providers/razorpay");
const mongoose = require("mongoose");
const razorpayprovider = require("../payments/providers/razorpay");

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
    console.log('Processing payment webhook event from razorpay {}', req.body.event, razPayPayment.id, payment._id, userRegistration._id, razPayPayment.status);

    /*
    Checking for duplicate event that is not processed sucessfully.
     */
    let duplicateEvent = await PaymentWebhook.findOne({'headers.x-razorpay-event-id': paymentwebhook.headers['x-razorpay-event-id'], status: 'processed'});
    if(duplicateEvent && duplicateEvent._id){
      console.error('Duplicate event found for webhook event {}', paymentwebhook.headers['x-razorpay-event-id'], duplicateEvent._id);
      throw new Error('Duplicate event found for webhook event');
    }
    /*
    Check for this order id any earlier event has been processed which is
     */
    let user = await User.findOne({name: 'RazorPayWebhookUser'});
    if (req.body.event === 'payment.failed') {
      const isOrderPaid = await razorpayprovider.isOrderPaid(razPayPayment.order_id);
      if (!isOrderPaid) {
        await userRegistration.updatePaymentStatus(payment, razPayPayment.status, razPayPayment.error_code, user._id);
      } else {
        console.log('Order is already paid, not updating status to failed ', userRegistration._id, userRegistration.registrationNumber, razPayPayment.id, razPayPayment.order_id);
      }
    } else if (req.body.event === 'payment.captured') {
      await userRegistration.updatePaymentStatus(payment, razPayPayment.status, 'Payment captured', user._id);
    } else if (req.body.event === 'payment.authorized') {
      if (payment.status !== 'captured' || payment.status !== 'failed' || payment.status !== 'refunded') {
        await userRegistration.updatePaymentStatus(payment, razPayPayment.status, 'Payment authorized', user._id);
      }
    } else if (req.body.event === 'refund.created') {
      payment.refundId = req.body.payload.refund.entity.id;
      await userRegistration.updatePaymentStatus(payment, 'refunded', 'Payment refunded', user._id);
    } else {
      console.log('Event not handled {}', req.body.event);
    }
    paymentwebhook.status = 'processed';
  } catch (e) {
    console.error('Error while processing webhook event from razorpay', e);
    if (e.message === 'Duplicate event found for webhook event') {
      paymentwebhook.status = 'duplicate';
    } else {
      paymentwebhook.status = 'failed';
      paymentwebhook.error = JSON.stringify(e);
    }
  } finally {
    await paymentwebhook.save();
  }
}

router.post('/payment/webhook/razorpay/', async (req, res) => {
  console.log('Handling webhook event from razorpay {}', req.body);
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
    if(!isSignatureValid){
      throw new Error('Invalid signature for webhook event');
    }
    /*
    find payment object in the system
     */
    payment = await Payment.findOne({'orderId': razPayPayment.order_id});
    if (!payment || !payment.registration) {
      console.log('Payment not found for webhook event {}', req.body, razPayPayment.order_id);
      throw new Error('Payment not found for webhook event');
    }
    userRegistration = await UserRegistration.findOne({_id: mongoose.Types.ObjectId(payment.registration)});
    if (!userRegistration || !userRegistration._id) {
      console.log('User registration not found for payment {}', payment._id, payment.registration, req.body);
      throw new Error('User registration not found for payment');
    }
    console.log('Persisting payment webhook event from razorpay', req.body.event, razPayPayment.id, payment._id, userRegistration._id, razPayPayment.status);
    await paymentWebhook.save();
    /*
    Processing webhook event.
     */
    await processWebhookEvent(razPayPayment, payment, userRegistration, req, paymentWebhook);
    res.status(200).send();
  } catch (e) {
    console.log('Error while handling razpay webhook', e);
    console.log('Error while handling razpay webhook body', JSON.stringify(req.body));
    res.status(400).send(e);
  }
});

module.exports = router;
