const mongoose = require('mongoose');
const validator = require('validator');
const addressSchema = require('./address');
const TermVersion = require('./termsversion');
const EventEnum = require('../enums/eventenum');
const razorpayprovider = require('../payments/providers/razorpay');
const Payment = require("./payments");
const EventConfiguration = require('./eventconfiguration');
const LinkedDocument = require("./linkeddocument");



// Create a Counter Schema
const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Create a Notification Schema
const NotificationSchema = new mongoose.Schema({
    isSuccessEmailSent: {type: Boolean, default: false},
    isFailureEmailSent: {type: Boolean, default: false},
    isRefundEmailSent: {type: Boolean, default: false},
    isEmailInProgress: {type: Boolean, default: false},
});

const ageDetails = new mongoose.Schema(
    {
        value: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
            required: true
        },
        prof: {
            type: {
                type: String,
                required: true,
                trim: true,
                enum: ['AADHAR', 'PASSPORT', 'OTHER', 'BIRTH_CERTIFICATE', 'PAN', 'DRIVING_LICENSE', 'VOTER_ID']
            },
            file: {
                type: String,
            },
            status: {
                type: String,
                enum: ['pending_verification', 'verified', 'rejected'],
                default: 'pending_verification'
            },
            ipAddress: {
                type: String,
            }
        }
    });

const userRegistrationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true],
            maxlength: [50, 'name cannot be more than 50 characters'],
            trim: true,
        },
        registrationNumber: {
            type: Number
        },
        profilePhoto: {
            type: String
        },
        age: {
            type: ageDetails,
            required: true
        },
        ageGroup: {
            type: String,
            enum: ['JUNIOR', 'SENIOR'],
        },
        mobileNumber: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 10,
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of Birth is required'],
            validate: {
                validator: function (dob) {
                    let age  = getAge(dob);
                    return age >= 8 && age <= 30;
                },
                message: 'Participant must be between 8 and 30 years old'
            }
        },
        guardianName: {
            type: String,
            required: [true],
            maxlength: [50, 'guardianName cannot be more than 50 characters'],
            trim: true,
        },
        hasTakenSingingLessons: {
            type: Boolean,
            required: false
        },
        preferredAuditionLocation: {
            type: String,
            required: [true],
            enum: {
                values: ['Gagret', 'Talwara', 'Una', 'Kangra', 'Jalandhar'],
                message: '{VALUE} is not a valid Audition Location'
            },
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [
                /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
                'Please enter a valid email address'
            ]
        },
        address: {
            type: addressSchema,
            required: [true, 'Address is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'registered', 'rejected', 'failed'],
        },
        statusReason: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        termsVersion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'term_versions',
            required: [true, 'Terms version is required'],
            validate: {
                validator: async function (v) {
                    // Assuming you have a Terms model to check if this version exists
                    const terms = await TermVersion.findById(v);
                    return terms !== null;
                },
                message: 'Invalid terms version'
            }
        },
        event: {
            type: Number,
        },
        registrationAmount: {
            type: Number,
            required: true,
            validate: {
                validator: async function (amount) {
                    let event = EventEnum.fromInt(this.event);
                    if (EventEnum.KHITAB_E_SWAR_2025 == event) {
                        let age = this.age.value;
                        if (age <= 17) {
                            const juniorAmount = await EventConfiguration.getConfiguration(this.event, 'registrationAmount', 'JUNIOR');
                            return amount === juniorAmount
                        } else {
                            const seniorAmount = await EventConfiguration.getConfiguration(this.event, 'registrationAmount', 'SENIOR');
                            return amount === seniorAmount
                        }
                    }

                },
                message: 'Invalid amount for event | age'
            }
        },
        payments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payments'
        }],
        notification: NotificationSchema,
        isTestRegistration: {
            type: Boolean,
        }
    },
    {
        timestamps: true,
    }
);

/**
 * Get Age of the participant
 * @param dateOfBirth
 * @returns {number}
 */
function getAge(dateOfBirth) {
    // Check if age is between 5 and 100 years
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

/**
 * Get Age of the participant
 * @returns {number}
 */
userRegistrationSchema.statics.getAge = function (dateOfBirth) {
    return getAge(dateOfBirth);
}

/**
 * Method to get documents linked with this user registration
 * @returns {Promise<void>}
 */
userRegistrationSchema.methods.getLinkedDocuments = async function () {
    let uid = mongoose.Types.ObjectId(this._id);
    const linkedDocumentList = await
        LinkedDocument.find({userRegistrationId: uid});
    return linkedDocumentList;
}

/**
 * Method to intiate a payment against a registration
 * @param amount
 * @param currency
 * @param provider
 * @returns {Promise<{amount: *, orderId: *, paymentId, currency: *}>}
 */
userRegistrationSchema.methods.initiatePayment = async function (user) {
    try {
        console.log('Initiating payment for registration {} {}', this._id, this.registrationAmount, this.name);
        const {id, status, metaData} =
            await razorpayprovider.initiatePayment(this.registrationAmount , {userRegistrationId: this._id});

        // Create new payment document
        const payment = new Payment({
            amount: this.registrationAmount,
            currentStatus: 'initiated',
            orderId: id,
            registration: this._id,
            metadata: metaData,
            paymentType: 'REGISTRATION_FEE',
            statusReason: 'Payment initiated',
            createdBy: user._id,
            lastModifiedBy: user._id
        });

        await payment.save();
        // Update registration with payment reference
        this.payments.push(payment._id);

        await this.save();

        return {paymentId: payment._id, orderId: id, status: status};

    } catch (error) {
        console.log('Error while intiating payment ',error);
        throw new Error(`Payment initiation failed: ${error.message}`);
    }
};

/**
 * Method to update payment status
 * @param payment
 * @param status
 * @param stausReason
 * @param lastModifiedBy
 * @returns {Promise<void>}
 */
async function updatePaymentStatus(payment, status, stausReason, lastModifiedBy) {
    payment.currentStatus = status;
    payment.statusReason = stausReason;
    payment.lastModifiedBy = lastModifiedBy;
    /*
    update payment details and status
     */
    await payment.save();
}

/**
 * Method to udpate payment status
 * @param payment
 * @param status
 * @param stausReason
 * @param lastModifiedBy
 * @returns {Promise<void>}
 */
userRegistrationSchema.methods.updatePaymentStatus = async function (payment, status, stausReason, lastModifiedBy) {
    await updatePaymentStatus(payment, status, stausReason, lastModifiedBy);
}

// Add a static method to find users by age
userRegistrationSchema.statics.getAgeGroup = function (dateOfBirth) {
    let age = getAge(dateOfBirth);
    if (age <= 17) {
        return 'JUNIOR';
    } else {
        return 'SENIOR';
    }
};

/*
Complete payment post verification of the signature
 */
userRegistrationSchema.methods.completePayment = async function (
    paymentId,
    orderId,
    signature,
    lastModifiedBy
) {
    try {
        // Find and update payment document
        const payment = await Payment.findOne({
            orderId: orderId,
            currentStatus: ['initiated']
        });
        if (!payment) {
            console.log('Payment not found {} {}', orderId, paymentId);
            throw new Error('Payment not found');
        }

        let {status, metaData} = await razorpayprovider.completePayment(paymentId, orderId, signature);
        payment.paymentResponse = metaData
        await updatePaymentStatus(payment, status, 'Payment completed successfully', lastModifiedBy);
        return {
            success: true,
            paymentId: payment._id,
            status: status
        };
    } catch (error) {
        console.error(`Payment completion failed`,error);
        throw new Error(`Payment completion failed ${error.message}`);
    }
};

userRegistrationSchema.methods.failPayment = async function (paymentId, orderId, reason, lastModifiedBy) {
    try {
        // Find and update payment document
        const payment = await Payment.findOne({
            orderId: orderId,
            currentStatus: ['initiated']
        });
        if (!payment) {
            console.log('Payment not found {} {}', orderId, paymentId);
            throw new Error('Payment not found');
        }
        if(paymentId){
            let {status, metaData} = await razorpayprovider.failPayment(paymentId);
            payment.paymentResponse = metaData
        }
        await updatePaymentStatus(payment, 'failed', 'Payment Failed', lastModifiedBy);
        return {
            success: true,
            paymentId: payment._id,
        };
    } catch (error) {
        console.error(`Payment failure failed`,error);
        throw new Error(`Payment failure recording failed: ${error.message}`);
    }
};

// Helper method to get payment status
userRegistrationSchema.methods.getPaymentStatus = async function (orderId) {
    const payment = await Payment.findOne({orderId: orderId});
    if (!payment) {
        throw new Error('Payment not found');
    }
    return {
        status: payment.currentStatus,
        amount: payment.amount,
        currency: payment.currency,
        timeline: payment.timeline
    };
};

// Middleware for Payment Schema
userRegistrationSchema.pre('save', async function(next) {
    if (!this.registrationNumber) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'registrationNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.registrationNumber = counter.seq;
            next();
        } catch (error) {
            console.error('Error while generating registration number', error);
            return next(error);
        }
    } else {
        next();
    }
});

const Counter = mongoose.model('counters', CounterSchema);

const UserRegistration = mongoose.model('user_registrations', userRegistrationSchema);

module.exports = UserRegistration;
