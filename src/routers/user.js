const express = require('express');
const multer = require('multer');
// const sharp = require('sharp')
const User = require('../models/user');
const auth = require('../middleware/auth-local');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/email');
const router = new express.Router();
const googleAuth= require('../middleware/auth-googleouth');
const authorizationMiddleware = require('../middleware/authorization');
const RoleEnum = require('../enums/roleenum');
let pingTime = 0;

router.post('/user', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({user, token});
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/user/login', googleAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log('User login request ', req.user.email);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});


router.get('/user/me', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/user/me', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/user/me', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }

    cb(undefined, true);
  },
});

// router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
//     const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
//     req.user.avatar = buffer
//     await req.user.save()
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

router.delete('/user/me/avatar', auth, authorizationMiddleware(RoleEnum.ADMIN), async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get('/user/:id/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

router.get('/ping', async (req, res) => {
  if(Date.now() - pingTime > 600000) {
    pingTime = Date.now();
    console.log('Called ping API');
  }
  res.status(200).send('pong');
});

module.exports = router;
