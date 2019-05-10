const nodemailer = require('nodemailer');

// gmail details for email sending
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'haslermanagement@gmail.com',
        pass: 'Kayak123'
    }
})

module.exports = {
    /**
     * Email sending function
     * @param to Email address of email to be sent to
     * @param subject Subject of email
     * @param body Body of email
     */
    send: function(to, subject, body) {
        let options = {
            from: 'haslermanagement@gmail.com',
            to: to,
            subject: subject,
            text: body
        }

        transporter.sendMail(options, function(error, info){
            if(error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        })
    }
}

