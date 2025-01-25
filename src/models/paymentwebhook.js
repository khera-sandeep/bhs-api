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
        status: {
            type: String,
            required: true,
            default: 'new'
        },
       createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
    },
    {
        timestamps: true,
    });

const PaymentWebhook = mongoose.model('payment_webhooks', paymentWebhookSchema);

module.exports = PaymentWebhook;
