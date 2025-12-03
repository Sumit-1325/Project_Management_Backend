import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Proj Management',
            link: 'https://proj-management.netlify.app/',
        },
    });

    // Generate HTML and (optional) plain text versions
    const htmlEmail = mailGenerator.generate(options.mailgenContent);
    const textEmail = mailGenerator.generatePlaintext
        ? mailGenerator.generatePlaintext(options.mailgenContent)
        : '';

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    const message = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: textEmail,
        html: htmlEmail,
    };

    try {
        await transporter.sendMail(message);
        console.log("✅ Email sent successfully!");
    } catch (error) {
        console.error("❌ Error sending email: Check your credentials or SMTP settings.\n", error);
    }
};

const mailGeneratorVerification = (userName, verificationUrl) => {
    return {
        body: {
            name: userName,
            intro: "Welcome to Proj Management! We're very excited to have you on board.",
            action: {
                instructions: 'To get started with your account, please click here:',
                button: {
                    color: '#22BC66',
                    text: 'Verify your email',
                    link: verificationUrl,
                },
            },
            outro: "Need help or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const forgetPasswordMail = (userName, resetUrl) => {
    return {
        body: {
            name: userName,
            intro: 'You have requested to reset your password.',
            action: {
                instructions: 'To reset your password, please click here:',
                button: {
                    color: '#DC4D2F',
                    text: 'Reset your password',
                    link: resetUrl,
                },
            },
            outro: "Need help or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

export { mailGeneratorVerification, forgetPasswordMail, sendEmail };
