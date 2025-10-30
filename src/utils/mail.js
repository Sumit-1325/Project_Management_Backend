import Mailgen from 'mailgen';

const mailGeneratorVerification = (userName,verificationUrl) => {
    return {
            body: {
                name: userName,
                intro: 'Welcome to Proj Management! We\'re very excited to have you on board.',
                action: {
                    instructions: 'To get started with your account, please click here:',
                    button: {
                        color: '#22BC66',
                        text : 'Verify your email',
                        link : verificationUrl
                    }
                },
                outro : 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}


const forgetPasswordMail = (userName,resetUrl) => {
    return {
            body: {
                name: userName,
                intro: 'You have requested to reset your password.',
                action: {
                    instructions: 'To reset your password, please click here:',
                    button: {
                        color: '#DC4D2F',
                        text : 'Reset your password',
                        link : resetUrl
                    }
                },
                outro : 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}

export {
    mailGeneratorVerification,
    forgetPasswordMail
}