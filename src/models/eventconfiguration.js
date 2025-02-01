const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");

const eventConfigurationSchema = new mongoose.Schema({
        event: {
            type: Number,
            required: true,
            trim: true,
        },
        key: {
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: String,
        },
        valueObject: {
            type: Object,
        },
       createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    },
    {
        timestamps: true,
    });

/**
 * Get configuration value for a key and a valueObject key
 * @returns {number}
 */
eventConfigurationSchema.statics.getConfiguration = async function (event, key, valueObjKey,) {
    const eventConfiguration = await this.findOne({event, key});

    if (!eventConfiguration) {
        console.log('No configuration value found for eventId and key', event, key);
        return null;
    }

    if (eventConfiguration.value) {
        return eventConfiguration.value;
    } else if (eventConfiguration.valueObject) {
        return eventConfiguration.valueObject[valueObjKey];
    } else {
        return null;
    }
}

const EventConfiguration = mongoose.model('event_configurations', eventConfigurationSchema);

module.exports = EventConfiguration;
