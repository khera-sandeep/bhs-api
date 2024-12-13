const jwt = require('jsonwebtoken')
const User = require('../models/user')
const {OAuth2Client} = require("google-auth-library");
const authGoogleOauth = async (req, res, next) => {
    try {
        // check header or url parameters or post parameters for token
        const token = req.header('Authorization').replace('Bearer ', '')
        if (token) {
            const payload = await isTokenValid(token)
            if (payload) {
                let user = await User.findByEmail(payload['email']);
                if (!user) {
                    //  create user in the system if it does not exist and save that in the database with the member role as all outh users are members
                    user = new User({name: payload['name'], email: payload['email'], origin: 'G_AUTH', role: 2});
                    await user.save();
                }
                req.token = token;
                req.user = user;
                req.decodedToken = payload;
                return next();
            }
        }
        throw new Error('Please authenticate.');
    } catch (e) {
        console.log("Error while authenticating user", e);
        res.status(401).send({error: 'Please authenticate.'})
    }

    /**
     * Function to verify google oauth token
     * @param token
     * @returns {Promise<TokenPayload>}
     */
    async function isTokenValid(token) {
        const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID, process.env.GOOGLE_AUTH_CLIENT_SECRET, process.env.GOOGLE_AUTH_CALLBACK_URL);
        const decodedToken = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_AUTH_CLIENT_ID,
        });
        let payload = decodedToken.getPayload();
        return payload;
    }
}

module.exports = authGoogleOauth
