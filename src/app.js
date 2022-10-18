const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const memberRouter = require('./routers/member');

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(memberRouter);

module.exports = app;
