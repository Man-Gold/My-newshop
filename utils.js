

const nodemailer = require('nodemailer')



const config = require('./config')


const transporter = nodemailer.createTransport(config.mail)

exports.sendEmail = (to, subject, content) => {
  const message = {
    from: config.mail.auth.user,
    to: to,
    subject: subject,
    html: content
  }
  
  return transporter.sendMail(message)
}