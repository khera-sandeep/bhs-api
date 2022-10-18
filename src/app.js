const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const memberRouter = require('./routers/member');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(userRouter);
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  })
);
app.use(memberRouter);

module.exports = app;
