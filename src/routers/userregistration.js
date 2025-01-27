const express = require('express');
const auth = require('../middleware/auth-local');
const router = new express.Router();
const mongoose = require('mongoose');
const authorizationMiddleware = require('../middleware/authorization');
const UserRegistration = require('../models/userregistration');
const Payment = require('../models/payments');
const EventEnum = require('../enums/eventenum');
const RoleEnum = require("../enums/roleenum");

router.post('/userRegistration', auth, async (req, res) => {
  try {
    console.log('Inside userRegistration API {} {}', req.body.name, req.body.email);
    const userRegistration = new UserRegistration({
      ...req.body,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id,
      ageGroup: UserRegistration.getAgeGroup(req.body.dateOfBirth),
      status: 'pending',
      email: req.user.email,
      event: EventEnum.KHITAB_E_SWAR_2025,
      'age.value' : UserRegistration.getAge(req.body.dateOfBirth),
    });
    await userRegistration.save();
    let {paymentId, orderId} = await userRegistration.initiatePayment(req.user);
    res.status(201).send({
      userRegistrationId: userRegistration._id,
      registrationNumber: userRegistration.registrationNumber,
      paymentId,
      orderId
    });
  } catch (e) {
    console.log('Error while registering user', e);
    res.status(400).send({ errors: { message: e.message } });
  }
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/userRegistration', auth, authorizationMiddleware(RoleEnum.ADMIN),
    async (req, res) => {
      console.log('Getting userRegistration list with query params {}', req.query);
      try {
        let limit = 0;
        let skip = 0;
        let filter = {};
        for (let queryKey in req.query) {
          const value = req.query[queryKey];
          if (queryKey === 'sortBy') {
            sort = value
          }
          else if (queryKey === 'limit') {
            limit = parseInt(value);
          }
          else if (queryKey === 'skip') {
            skip = parseInt(value);
          }
          else {filter[queryKey] = value;}
        }
        let registrationList = await UserRegistration.find(filter).limit(limit).skip(skip).sort({ createdAt: -1 });
        let count  = await UserRegistration.countDocuments(filter);
        console.log('Count returned {} {}', req.query, count);
        res.send({data: registrationList, count: count});
      } catch (e) {
        res.status(500).send();
      }
    });

router.get('/userRegistration/me', auth, authorizationMiddleware(RoleEnum.USER), async (req, res) => {
  const _id = req.user._id;
  try {
    console.log('Inside get userRegistration API for user {} {}', req.user.email, req.user._id);
    let uid = mongoose.Types.ObjectId(_id);
    const userRegistration = await UserRegistration.find({ createdBy: uid });
    res.send(userRegistration);
  } catch (e) {
    console.log('Error while getting record with id {}', _id, e);
    res.status(404).send();
  }
});

router.post('/userRegistration/:id/payment/:paymentId', auth, authorizationMiddleware(RoleEnum.USER), async (req, res) => {
    try {
      const value = req.body['status'];
      console.log('Inside patch userRegistration API for user {} operation {}', req.user.email, value);
      const razOrderId = req.body['orderId'];
      const razPaymentId = req.body['paymentId'];
      const signature = req.body['signature'];
      let uid = mongoose.Types.ObjectId(req.params.id);
      let userId = mongoose.Types.ObjectId(req.user._id);
      let paymentId = mongoose.Types.ObjectId(req.params.paymentId);
      if(!value || !(value === 'complete' || value === 'fail')) {
        console.error('Invalid query param {} operation {}', req.user.email, value, uid, paymentId);
        throw new Error('Invalid operation for updating payment' + value + uid + paymentId);
      }
      const userRegistration = await UserRegistration.findOne({_id: uid, createdBy: userId});
      if(!userRegistration) {
        console.error('User registration not found {} {}', uid, userId);
        return res.status(404).send();
      }
      const payment = await Payment.findOne({_id: paymentId, createdBy: userId});
      if(!payment) {
        console.error('Payment not found {} {}', paymentId, userId);
        return res.status(404).send();
      }
      if (userRegistration._id.toString() !== payment.registration.toString()) {
        console.error('Payment not associated with registration {} {}', paymentId, uid);
        return res.status(404).send();
      }
      if(payment.orderId !== razOrderId) {
        console.error('Payment not matching with order {} {}', paymentId, razOrderId);
        return res.status(404).send();
      }
      let response = {};
      if (value === 'complete') {
        response = await userRegistration.completePayment(razPaymentId, razOrderId, req.body.signature);
      } else if (value === 'fail') {
        response = await userRegistration.failPayment(razPaymentId, razOrderId, req.body.reason);
      }
      res.send({
        ...response,
        registrationNumber: userRegistration.registrationNumber
          }
      )
      ;
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
