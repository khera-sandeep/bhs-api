const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // generated ethereal user
        pass:  process.env.EMAIL_PASSWORD,
    },
});

// async.await is not allowed in global scope, must use a wrapper
async function sendEmail(emailTo, subject, text, html) {
    try {
// send mail with defined transport object
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM, // sender address
            to: emailTo, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: "<b>Hello world?</b>", // html body
        });
        console.log("Email sent: {} {} {}", info.messageId, emailTo, subject);
    } catch (e) {
        console.error("Error while sending email to {} {}", emailTo, subject, e);
    }
}


const sendWelcomeEmail = (email, name) => {

}

const sendCancelationEmail = (email, name) => {

}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
