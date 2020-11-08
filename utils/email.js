const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const nodemailerSendgrid = require('nodemailer-sendgrid');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = 'Anish Bhateja <hello@anish.io> ';
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Send Grid
      // return nodemailer.createTransport({
      //   service: 'SendGrid',
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSWORD,
      //   },
      // });
      // return nodemailer.createTransport(
      //   nodemailerSendgrid({
      //     apiKey: process.env.SENDGRID_PASSWORD,
      //   })
      // );

      //GMAIL
      return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }
    // In development mailtrap

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //send the actual email
  async send(template, subject) {
    //1) Render HTML based on a pug template

    const html = await pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    //2) Define Email mailOptions
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html), //coverting html to normal text for those prefer normal text
    };

    //3 Create transport and send email
    await this.newTransport().sendMail(mailOptions);
    //await transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family! ');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

//1) Create Transporter
//   const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       password: process.env.EMAIL_PASSWORD,
//     },
//     //activate less secure apps on gmail
//   });
