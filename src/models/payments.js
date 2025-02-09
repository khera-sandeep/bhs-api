const mongoose = require('mongoose');
const validator = require('validator');
const addressSchema = require('./address');
const TermVersion = require('./termsversion');
const EventEnum = require('../enums/eventenum');
const {sendEmail} = require("../emails/email");
const EventConfiguration = require('./eventconfiguration');

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
            enum: ['initiated','created', 'pending', 'captured', 'settled', 'refunded', 'failed', 'authorized']
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
async function sendNotification(userRegistration, objectToSave, doc) {
    try{
        const result = await mongoose.model('user_registrations').findOneAndUpdate(
            {
                _id: doc.registration,
                'notification.isEmailInProgress': false
            },
            {$set: {'notification.isEmailInProgress': true}},
            {new: true}
        );
            /*
        Send emails out for the event
         */
        if (result) {
            if (userRegistration.status === 'registered' && !userRegistration.notification.isSuccessEmailSent) {
                const venueDateConfig = await EventConfiguration.getConfiguration(userRegistration.event, 'eventDate', userRegistration.preferredAuditionLocation);
                const venueEventConfig = await EventConfiguration.getConfiguration(userRegistration.event, 'eventVenue', userRegistration.preferredAuditionLocation);
                if (await sendEmail(userRegistration.email, EventEnum.KHITAB_E_SWAR_2025, 'REGISTRATION_SUCCESS', {
                    name: userRegistration.name,
                    eventCity: userRegistration.preferredAuditionLocation,
                    eventVenue: venueEventConfig != null ? venueEventConfig : 'To be announced later',
                    registrationNumber: userRegistration.registrationNumber,
                    eventDate: venueDateConfig != null ? venueDateConfig : '-',
                    eventTime: '09:00 AM Onwards',
                })) {
                    objectToSave = {
                        "notification.isSuccessEmailSent": true,
                    };
                    await mongoose.model('user_registrations').findByIdAndUpdate(
                        doc.registration,
                        {$set: objectToSave},
                        {new: true} // Returns the modified document
                    );
                }
            } else if (userRegistration.status === 'failed') {
                if (await sendEmail(userRegistration.email, EventEnum.KHITAB_E_SWAR_2025, 'REGISTRATION_FAILURE', {
                    name: userRegistration.name,
                })) {
                    objectToSave = {
                        "notification.isFailureEmailSent": true,
                    };
                    await mongoose.model('user_registrations').findByIdAndUpdate(
                        doc.registration,
                        {$set: objectToSave},
                        {new: true} // Returns the modified document
                    );
                }
            }
        }
        else {
            console.log('Not sending email as email already in progress');
        }
    }catch (e) {
        console.error('Error while sending email status', e);
    } finally {
        try {
            const result = await mongoose.model('user_registrations').findOneAndUpdate(
                {
                    _id: doc.registration,
                    'notification.isEmailInProgress': true
                },
                {$set: {'notification.isEmailInProgress': false}},
                {new: true}
            );
        } catch (e) {
            console.error('Error while updating email status', e);
        }
    }
}

// Correct way - handles both save and merge
paymentSchema.post('save', async function (doc) {
    // For findOneAndUpdate, we need to fetch the document if it's not provided
    if (!doc) {
        doc = await this.findOne();
    }
    console.log('Updating registration status on payments status change {}', doc.currentStatus, doc._id);
    let objectToSave = {};
    if (doc && (doc.currentStatus === 'created' || doc.currentStatus === 'captured' || doc.currentStatus === 'authorized') && doc.paymentType === 'REGISTRATION_FEE') {
        objectToSave = {
            status: 'registered',
            statusReason: 'Registered successfully',
            lastModifiedBy: doc.lastModifiedBy
        };

    } else if (doc && (doc.currentStatus === 'failed' || doc.currentStatus === 'refunded') && doc.paymentType === 'REGISTRATION_FEE') {
        objectToSave = {
            status: 'failed',
            statusReason: doc.statusReason,
            lastModifiedBy: doc.lastModifiedBy
        };
    }
    const userRegistration = await mongoose.model('user_registrations').findByIdAndUpdate(
        doc.registration,
        objectToSave,
        {new: true}
    );
    await sendNotification(userRegistration, objectToSave, doc);
});

const Payment = mongoose.model('payments', paymentSchema);

module.exports = Payment;
