const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'haslermanagement@gmail.com',
        pass: 'Kayak123'
    }
})

module.exports = {
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

