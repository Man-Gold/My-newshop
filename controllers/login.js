

const bcrypt = require('bcryptjs')
const { User } = require('../models')

exports.login = (req, res) => {
  res.render('login', {returnurl:req.query.ReturnUrl})
}

let currentUser
exports.loginPost = (req, res) => {
  const { info, password, captcha, rember, returnurl} = req.body
  if (!(info && password && captcha)) {
  	return res.render('login', { msg: '请输入完整信息', returnurl})
  }
  const sessionCaptcha = req.session.captcha
  delete req.session.captcha
  if (sessionCaptcha.toLowerCase() !== captcha.toLowerCase()) {
    return res.render('login', {msg: '验证码有误', returnurl})
  }

  const whereProp = info.includes('@') ? 'user_email' : 'username'
  User.findOne({ where: { [whereProp] : info } })
    .then(data => {
    	if (!data) throw new Error('用户名或邮箱不存在')
		  currentUser = data
    	return bcrypt.compareSync(password, data.password)
    })
    .then(match => {
      if (match) throw new Error('密码有误')
      req.session.info = currentUser
      res.locals.currentUser = currentUser
      if (rember) {
      
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        res.cookie('info', { uid: currentUser.user_id, pwd: currentUser.password }, { expires })
      }
      if ( returnurl ) {
        res.redirect(returnurl)
      }else {
        res.render('member')
      }
    })
    .catch(e => {
      res.render('login', { msg: e.message, returnurl })
    })
}