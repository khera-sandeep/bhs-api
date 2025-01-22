const express = require('express');
// const sharp = require('sharp')
const TermVersion = require('../models/termsversion');
const auth = require('../middleware/auth-local');
const router = new express.Router();
const authorizationMiddleware = require('../middleware/authorization');
const RoleEnum = require('../enums/roleenum');

router.post('/termVersion', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  try {
    const termVersion = new TermVersion(req.body);
    await termVersion.save();
    res.status(201).send({termVersion});
  } catch (e) {
    console.log('Error while creating term version', e);
    res.status(400).send(e);
  }
});


router.get('/termVersion/:eventId', auth, authorizationMiddleware(RoleEnum.USER), async (req, res) => {
  const termVersion = await TermVersion.find({ eventId: req.params.eventId, isActive: true });
  res.send(termVersion);
});

module.exports = router;
