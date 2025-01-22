// src/payments/providers/razorpay.provider.js
const Razorpay = require('razorpay');
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET
});


/**
 * Initiate payment on RazorPay
 * @param amount
 * @param metaData
 * @returns {Promise<{metaData: Orders.RazorpayOrder, id: string, status: "created" | "attempted" | "paid"}>}
 */
async function initiatePayment(amount, metaData) {
    try {
        const orderOptions = {
            amount: amount * 100, // Razorpay expects amount in paise[1]
            currency: 'INR',
            receipt: metaData.userRegistrationId,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(orderOptions);

        return {
            id: order.id,
            status: order.status,
            metaData: order
        };
    } catch (error) {
        console.log('Error while creating order on razor pay', error);
        throw new Error(`Razorpay order creation failed: ${error.message}`);
    }
}

/**
 * Complete payment post verification of the signature
 * @param paymentId
 * @param orderId
 * @param signature
 * @returns {Promise<{metaData: Payments.RazorpayPayment, status: string}>}
 */
async function completePayment(paymentId, orderId, signature) {
    try {
        let generatedSignature = crypto
            .createHmac(
                "SHA256",
                process.env.RAZOR_PAY_KEY_SECRET
            )
            .update(orderId + "|" + paymentId)
            .digest("hex");

        let isSignatureValid = generatedSignature == signature;
        if (!isSignatureValid) {
            console.error('Razorpay payment verification failed as signature does not match {} {}', orderId, paymentId, generatedSignature, signature);
            throw new Error('Razorpay payment verification failed');
        }
        const payment = await razorpay.payments.fetch(paymentId);

        if (!payment || !(payment.status === 'captured' || payment.status === 'authorized') || payment.status === 'created') {
            console.error('Razorpay payment not in valid status for completion', orderId, paymentId);
            throw new Error('Razorpay payment verification failed');
        }
        return {
            status: payment.status,
            metaData: payment
        };
    } catch (error) {
        console.log(error);
        throw new Error(`Razorpay payment verification failed: ${error.message}`);
    }
}

/**
 * Fail a payment in Razor Pay
 * @param paymentId
 * @returns {Promise<{metaData: Payments.RazorpayPayment, status: "created" | "authorized" | "captured" | "refunded" | "failed"}>}
 */
async function failPayment(paymentId) {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            status: payment.status,
            metaData: payment
        };
    } catch (error) {
        console.log('Razorpay payment failure failed',error);
        throw new Error(`Razorpay payment failure failed: ${error.message}`);
    }
}


module.exports = {
    initiatePayment,
    completePayment,
    failPayment
}
