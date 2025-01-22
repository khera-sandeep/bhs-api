const mongoose = require('mongoose');
const validator = require('validator');

const termVersionSchema = new mongoose.Schema({
        content: {
            type: String,
            required: true,
            trim: true,
        },
        version: {
            type: String,
            required: true,
            trim: true
        },
        eventId: {
            type: Number,
            required: true
        },
        effectiveDate: {
            type: Date,
            required: true,
            default: Date.now
        } ,
        isActive:{
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true,
    });

const TermVersion = mongoose.model('term_versions', termVersionSchema);

module.exports = TermVersion;
