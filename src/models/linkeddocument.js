const mongoose = require('mongoose');
const validator = require('validator');

const linkedDocumentSchema = new mongoose.Schema({
        document: {
            type: String,
            required: true,
            trim: true,
        },
        userRegistrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user_registrations',
            required: true
        },
        status: {
            type: String,
            enum: ['pending_verification', 'verified', 'rejected'],
            default: 'pending_verification'
        },
        type: {
            type: String,
            enum: ['AADHAR', 'PASSPORT', 'OTHER', 'BIRTH_CERTIFICATE', 'PAN', 'DRIVING_LICENSE', 'VOTER_ID', 'PROFILE_PICTURE'],
            required: true
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
    },
    {
        timestamps: true,
    });

const LinkedDocument = mongoose.model('linked_documents', linkedDocumentSchema);

module.exports = LinkedDocument;
