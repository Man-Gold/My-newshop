
const captcha = require('svg-captcha')

exports.captcha = (req, res) => {
  const svg = captcha.create()

  req.session.captcha = svg.text

  res.type('svg')
  res.send(svg.data)
  
}



exports.require = (req, res, next) => {
  if (req.session.info) return next()
  res.redirect('/account/login?redirect=' + req.originalUrl)
}