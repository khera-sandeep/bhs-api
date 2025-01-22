const mongoose = require('mongoose');
const validator = require('validator');
const addressSchema = require('./address');
const TermVersion = require('./termsversion');
const EventEnum = require('../enums/eventenum');
const razorpayprovider = require('../payments/providers/razorpay');
const Payment = require("./payments");

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
                enum: ['AADHAR', 'PASSPORT', 'OTHER', 'BIRTH_CERTIFICATE']
            },
            file: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
                default: 'PENDING_VERIFICATION'
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
                    // Check if age is between 5 and 100 years
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const monthDiff = today.getMonth() - dob.getMonth();

                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }

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
            enum: ['PENDING', 'REGISTERED', 'REJECTED', 'FAILED'],
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
                            return amount === 450
                        } else {
                            return amount === 750
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
    },
    {
        timestamps: true,
    }
);

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

        return payment._id

    } catch (error) {
        console.log('Error while intiating payment ',error);
        throw new Error(`Payment initiation failed: ${error.message}`);
    }
};

async function updatePaymentStatus(payment, status, stausReason, lastModifiedBy, response) {
    payment.currentStatus = status;
    payment.paymentResponse = response;
    payment.statusReason = stausReason;
    payment.lastModifiedBy = lastModifiedBy;
    /*
    update payment details and status
     */
    await payment.save();
}

// Add a static method to find users by age
userRegistrationSchema.statics.getAgeGroup = function (dateOfBirth) {
    // Check if age is between 5 and 100 years
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

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
        await updatePaymentStatus(payment, status, 'Payment completed successfully', this.lastModifiedBy, metaData);
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

userRegistrationSchema.methods.failPayment = async function (paymentId, orderId, reason) {
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
        let {status, metaData} = await razorpayprovider.failPayment(paymentId);
        await updatePaymentStatus(payment, status, 'Payment Failed', this.lastModifiedBy, metaData);
        return {
            success: true,
            paymentId: payment._id,
            status: status
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

// Example usage in your controller:
/*
async function handlePaymentInitiation(req, res) {
    try {
        const registration = await UserRegistration.findById(req.params.registrationId);
        const paymentDetails = await registration.initiatePayment(500, 'INR');
        res.json(paymentDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function handlePaymentCompletion(req, res) {
    try {
        const { paymentId, orderId, signature } = req.body;
        const registration = await UserRegistration.findById(req.params.registrationId);
        const result = await registration.completePayment(paymentId, orderId, signature);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


 */


const UserRegistration = mongoose.model('user_registrations', userRegistrationSchema);

module.exports = UserRegistration;
