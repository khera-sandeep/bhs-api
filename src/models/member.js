const mongoose = require('mongoose');
const validator = require('validator');

const person = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
});

const identityProf = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  number: {
    type: String,
    trim: true,
    required: true,
  },
});

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 100,
      default: 0,
      required: true,
    },
    familyMembers: [
      {
        type: person,
        required: true,
      },
    ],
    identityProf: {
      type: identityProf,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is invalid');
        }
      },
    },
    referer: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model('members', memberSchema);

module.exports = Member;
