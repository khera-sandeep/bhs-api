const express = require('express');
const auth = require('../middleware/auth-local');
const Member = require('../models/member');
const router = new express.Router();
const mongoose = require('mongoose');
const authorizationMiddleware = require('../middleware/authorization');
const RoleEnum = require("../enums/roleenum");

router.post('/member', auth, async (req, res) => {
  try {
    console.log('Inside create member API {}', req.body.name);
    const member = new Member({
      ...req.body,
    });
    await findDuplicate(member.name, member.age, member.mobileNumber);
    await member.save();
    res.status(201).send(member);
  } catch (e) {
    console.log('Error while saving member', e);
    res.status(400).send({ errors: { message: e.message } });
  }
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/member', auth, authorizationMiddleware(RoleEnum.MANAGER),
    async (req, res) => {
      console.log('Getting memeber list with query params {}', req.query);
      try {
        let limit = 0;
        let sort = '1';
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
        let memberList = await Member.find(filter).limit(limit).skip(skip).sort(sort);
        let count  = await Member.countDocuments(filter);
        console.log('Count returned {} {}', req.query, count);
        res.send({data: memberList, count: count});
      } catch (e) {
        res.status(500).send();
      }
    });

router.get('/member/:id', auth, authorizationMiddleware(RoleEnum.USER), async (req, res) => {
  const _id = req.params.id;
  console.log('Inside get member api' + req.params.id);
  try {
    var mid = mongoose.Types.ObjectId(_id);
    const member = await Member.find({ _id: mid });

    if (!member) {
      console.log('Not found member with id ' + req.params.id);
      return res.status(404).send();
    }

    res.send(member);
  } catch (e) {
    console.log('Error while getting record with id {}', _id, e);
    res.status(404).send();
  }
});

router.patch('/member/:id', auth, authorizationMiddleware(RoleEnum.MANAGER), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const task = await Member.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/member/:id', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  try {
    const task = await Member.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

const findDuplicate = async (name, age, mobileNumber) => {
  const member = await Member.findOne({ name, age, mobileNumber });

  if (member) {
    throw new Error(
      `Member with name: ${name} age: ${age} mobileNumber: ${mobileNumber} already exists`
    );
  }
  return member;
};

module.exports = router;
