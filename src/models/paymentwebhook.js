const mongoose = require('mongoose');
const validator = require('validator');

const paymentWebhookSchema = new mongoose.Schema({
        request: {
            type: Object,
            required: true,
            trim: true,
        },
        headers: {
            type: Object,
            required: true,
            trim: true
        },
        paymentGateway: {
            type: String,
            required: true,
            default: 'RAZORPAY'
        },
        error: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: true,
            enum: ['new', 'processed', 'failed'],
            default: 'new'
        },
       createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    },
    {
        timestamps: true,
    });

const PaymentWebhook = mongoose.model('payment_webhooks', paymentWebhookSchema);

module.exports = PaymentWebhook;
