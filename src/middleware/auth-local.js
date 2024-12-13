const jwt = require('jsonwebtoken')
const User = require('../models/user')

const l = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id: decoded._id});

        if (!user) {
            throw new Error()
        }
        req.token = token;
        req.user = user;
        req.decodedToken=decoded;
        next();
    } catch (e) {
        console.log("Error while authenticating user", e);
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = l
