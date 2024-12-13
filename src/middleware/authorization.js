const jwt = require('jsonwebtoken')
const User = require('../models/user')

/**
 * Middleware for authorizing the user based on the role.
 * The role of the user access the resource should be higher than the role for which the resource is protected.
 * @param role
 * @returns {(function(*, *, *): Promise<*|undefined>)|*}
 */
const authorizationMiddleware = function (role) {
    return async (req, res, next) => {
            const decodedToken = req.decodedToken;
        try {
            if (!decodedToken || decodedToken.role > role) {
                throw new Error();
            }
            return next();
        } catch (e) {
            console.error('User is not Authorized to access the resource {}', decodedToken, e);
            res.status(403).send({error: 'you are not authorized to access this resource'})
        }
    }
}

module.exports = authorizationMiddleware;
