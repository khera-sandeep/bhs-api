const mongoose = require('mongoose');
const validator = require('validator');
const addressSchema = require('./address');
const TermVersion = require('./termsversion');
const EventEnum = require('../enums/eventenum');

// 2. Payment Timeline Schema (Sub-document)
const paymentTimelineSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    metadata: {
        type: Object,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }
});
// 3. Payment Schema
const paymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [1, 'Amount must be greater than 0']
        },
        currentStatus: {
            type: String,
            required: true,
            enum: ['initiated','created', 'pending', 'captured', 'settled', 'refunded', 'failed', 'approved']
        },
        paymentGateway: {
            type: String,
            required: true,
            enum: ['RAZORPAY', 'CCAVENUE'],
            default: 'RAZORPAY'
        },
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        metadata: {
            type: Object
        },
        paymentResponse: {
            type: Object,
            required: false
        },
        refundId: {
            type: String
        },
        registration: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user_registrations',
            required: true
        },
        paymentType: {
            type: String,
            enum: ['REGISTRATION_FEE', 'DONATION'],
            default: 'REGISTRATION_FEE',
            required: true
        },
        statusReason: {
            type: String
        },
        timeline: [paymentTimelineSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Middleware for Payment Schema
paymentSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.timeline.push({
            status: this.currentStatus,
            performedBy: this.lastModifiedBy
        });
    }
    next();
});

// Middleware for updating registration status after payments
// Correct way - handles both save and merge
paymentSchema.post('save', async function (doc) {
    // For findOneAndUpdate, we need to fetch the document if it's not provided
    if (!doc) {
        doc = await this.findOne();
    }
    console.log('Updating registration status on payments status change {}', doc.currentStatus, doc._id);
    let objectToSave = {};
    if (doc && (doc.currentStatus === 'created' || doc.currentStatus === 'captured' || doc.currentStatus === 'approved') && doc.paymentType === 'REGISTRATION_FEE') {
        objectToSave = {
            status: 'registered',
            statusReason: 'Registered successfully',
            lastModifiedBy: doc.lastModifiedBy
        };

    } else if (doc && doc.currentStatus === 'failed' && doc.paymentType === 'REGISTRATION_FEE') {
        objectToSave = {
            status: 'failed',
            statusReason:doc.statusReason,
            lastModifiedBy: doc.lastModifiedBy
        };
    }
    await mongoose.model('user_registrations').findByIdAndUpdate(
        doc.registration,
        objectToSave,
    );
});

const Payment = mongoose.model('payments', paymentSchema);

module.exports = Payment;
