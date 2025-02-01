const nodemailer = require("nodemailer");
const EventEnum = require("../enums/eventenum");
const handlebars = require('handlebars');

const REGISTRATION_SUCCESS_TEMPLATE = `<div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
    <!-- Header with Gradient -->
    <div style="background: linear-gradient(45deg, hsl(41.45deg 74.51% 60%), hsl(41.45deg 74.51% 40%)); padding: 40px 20px; text-align: center; border-radius: 0 0 30px 30px;">
        <img src="https://bhs-api.onrender.com/images/kithab-e-swar.jpeg" alt="KITHAB-E-SWAR" style="max-width: 200px; height: auto; display: block; margin:  0 auto 20px auto;">
        <h1 style="text-align: center; font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">You're In! 🎉</h1>
        <p style="text-align: center; font-size: 18px; margin-top: 10px;">Get ready to shine on stage!</p>
    </div>

    <div style="padding: 30px;">
        <p style="font-size: 18px; line-height: 1.6;">Dear <span style="color: hsl(41.45deg 74.51% 60%); font-weight: bold;">{{name}}</span>,</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Your journey to stardom begins now! We're thrilled to have you join the KITHAB-E-SWAR family. 🌟</p>
        
        <!-- Event Details Card -->
        <div style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a); padding: 25px; border-radius: 15px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <h2 style="color: hsl(41.45deg 74.51% 60%); margin-top: 0;">🎤 Your Spotlight Moment</h2>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
                <li style="margin: 10px 0;">📅 Date: <span style="color: hsl(41.45deg 74.51% 60%)">{{eventDate}}</span></li>
                <li style="margin: 10px 0;">⏰ Time: <span style="color: hsl(41.45deg 74.51% 60%)">{{eventTime}}</span></li>
                <li style="margin: 10px 0;">📍 Audition Location: <span style="color: hsl(41.45deg 74.51% 60%)">{{eventCity}}</span></li>
                <li style="margin: 10px 0;">📍 Venue: <span style="color: hsl(41.45deg 74.51% 60%)">{{eventVenue}}</span></li>
                <li style="margin: 10px 0;">🎫 Registration Number: <span style="color: hsl(41.45deg 74.51% 60%)">{{registrationNumber}}</span></li>
            </ul>
        </div>

        <!-- Preparation Steps -->
        <div style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a); padding: 25px; border-radius: 15px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <h2 style="color: hsl(41.45deg 74.51% 60%); margin-top: 0;">🌈 Your Path to Success</h2>
            <div style="margin: 15px 0;">
                <p style="margin: 10px 0;">✨ Choose and perfect your performance piece</p>
                <p style="margin: 10px 0;">📋 Review the competition guidelines</p>
            </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="https://bhs-api.onrender.com/images/kithab-e-swar-guidelines.html" style="background: linear-gradient(45deg, hsl(41.45deg 74.51% 60%), hsl(41.45deg 74.51% 40%)); color: black; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; transition: transform 0.3s ease;">Download Performance Guidelines</a>
        </div>

        <p style="line-height: 1.6;">Questions? We're here to help! Reach out to us at:</p>
        <p style="color: hsl(41.45deg 74.51% 60%);">📧 {{contactEmail}} 📞 86280-89371</p>

        <p style="margin-top: 30px; line-height: 1.6;">Break a leg! 🎭</p>
        <p style="color: hsl(41.45deg 74.51% 60%); font-weight: bold;">The KITHAB-E-SWAR Team</p>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #666; font-size: 12px;">© 2025 . All rights reserved.</p>
            <div style="margin-top: 15px;">
                <a href="https://www.instagram.com/khitabeswar?igsh=OWZ1dzR4OWxnNmw=" style="color: hsl(41.45deg 74.51% 60%); text-decoration: none; margin: 0 10px;">Instagram</a>
                <a href="https://www.facebook.com/share/8PZ3JaNS77KyWj9u/" style="color: hsl(41.45deg 74.51% 60%); text-decoration: none; margin: 0 10px;">Facebook</a>
            </div>
        </div>
    </div>
</div>
`
const REGISTRATION_FAILURE_TEMPLATE = `
<div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
    <!-- Header with Gradient -->
    <div style="background: linear-gradient(45deg, hsl(41.45deg 74.51% 60%), hsl(41.45deg 74.51% 40%)); padding: 40px 20px; text-align: center; border-radius: 0 0 30px 30px;">
        <img src="https://bhs-api.onrender.com/images/kithab-e-swar.jpeg" alt="KITHAB-E-SWAR" style="max-width: 200px; height: auto; display: block; margin:  0 auto 20px auto;">
        <h1 style="text-align:center; font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Registration Failed 🚫</h1>
        <p style="text-align:center; font-size: 18px; margin-top: 10px;">We couldn't complete your registration.</p>
    </div>

    <div style="padding: 30px;">
        <p style="font-size: 18px; line-height: 1.6;">Dear <span style="color: hsl(41.45deg 74.51% 60%); font-weight: bold;">{{name}}</span>,</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your registration for KITHAB-E-SWAR could not be completed due to one of the following reasons:</p>
        
        <!-- Issue Details Card -->
        <div style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a); padding: 25px; border-radius: 15px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <ul style="list-style-type: none; padding: 0; margin: 0;">
                <li style="margin: 10px 0;">💳 Failed Payment</li>
                <li style="margin: 10px 0;">📄 Invalid Address Proof</li>
            </ul>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">To resolve this issue and proceed further, please log in to our website using your Gmail ID for more details.</p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="https://derababaharishahji.in/home" style="background: linear-gradient(45deg, hsl(41.45deg 74.51% 60%), hsl(41.45deg 74.51% 40%)); color: black; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; transition: transform .3s ease;">Login to Your Account</a>
        </div>

        <!-- Support Section -->
        <p style="line-height: 1.6;">If you have any questions or need assistance, feel free to contact us:</p>
        <p style="color:hsl(41.45deg74.51%60%)">📧 {{supportEmail}} 📞 86280-89371</p>

        <p style="margin-top30pxlineheight16">We hope you resolve this soon and join us on your journey to stardom! 🌟</p>
        <p style="color:hsl(41.45deg74.51%60%); font-weight:bold;">The KITHAB-E-SWAR Team</p>

        <!-- Footer -->
        <div style="text-align:center;margin-top40px;padding-top20px;border-top1pxsolid#333;">
            <p style="color:#666;font-size12px;">©2025 . All rights reserved.</p>
            <div style="margin-top15px;">
                <a href="https://www.instagram.com/khitabeswar?igsh=OWZ1dzR4OWxnNmw" style="color:hsl(41.45deg74.51%60%); text-decoration:none;margin-right10px;">Instagram</a>
                <a href="https://www.facebook.com/share/8PZ3JaNS77KyWj9u/" style="color:hsl(41.45deg74.51%60%); text-decoration:none;margin-left10px;">Facebook</a>
            </div>
        </div>
    </div>
</div>

`

const notificationObject = [{
    event: EventEnum.KHITAB_E_SWAR_2025,
    type: 'REGISTRATION_SUCCESS',
    subject: handlebars.compile('Welcome to the Stage, {{name}}! Your Musical Journey Begins!'),
    body: handlebars.compile(REGISTRATION_SUCCESS_TEMPLATE)
},
    {
        event: EventEnum.KHITAB_E_SWAR_2025,
        type: 'REGISTRATION_FAILURE',
        subject: handlebars.compile('Dear {{name}}, Your Registration Could Not Be Completed'),
        body: handlebars.compile(REGISTRATION_FAILURE_TEMPLATE)
    }
];

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // generated ethereal user
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Gets the template from configured templates for an event and type
 * @param event
 * @param type
 * @returns {{subject: string, body: string}}
 */
const getEmailTemplate = (event, type) => {
    const notification = notificationObject.find(
        template => template.event.value === event.value && template.type === type
    );
    return {'subject': notification.subject, 'body': notification.body};
};

// async.await is not allowed in global scope, must use a wrapper
async function sendEmail(emailTo, event, notificationType, values) {
    try {
        const emailDetails = getEmailTemplate(event, notificationType);
        let subject = emailDetails.subject(values);
        let body = emailDetails.body(values);

// send mail with defined transport object
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM, // sender address
            to: emailTo, // list of receivers
            subject: subject, // Subject line
            html: body, // html body
        });
        console.log("Email sent: {} {} {}", info.messageId, emailTo, subject);
        return true;
    } catch (e) {
        console.error("Error while sending email ", e);
        return false;
    }

}


const sendWelcomeEmail = (email, name) => {

}

const sendCancelationEmail = (email, name) => {

}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendCancelationEmail
}
