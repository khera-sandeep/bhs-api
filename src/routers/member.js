const express = require('express');
const auth = require('../middleware/auth');
const Member = require('../models/member');
const router = new express.Router();
const mongoose = require('mongoose');

router.post('/member', auth, async (req, res) => {
  try {
    console.log('Inside create member API ' + JSON.stringify(req.body));
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
router.get('/member', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: 'member',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/member/:id', auth, async (req, res) => {
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

router.patch('/member/:id', auth, async (req, res) => {
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

router.delete('/member/:id', auth, async (req, res) => {
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

var findDuplicate = async (name, age, mobileNumber) => {
  const member = await Member.findOne({ name, age, mobileNumber });

  if (member) {
    throw new Error(
      `Member with name: ${name} age: ${age} mobileNumber: ${mobileNumber} already exists`
    );
  }
  return member;
};

module.exports = router;
