/**
 * 账号控制器
 */
const bcrypt = require('bcryptjs')
const utils = require('../utils')
const { User } = require('../models')
const uuid = require('uuid')

exports.register = (req, res) => {
  res.render('register')
}

exports.registerPost = (req, res) => {
  const {username, email, password, confirm, agree} = req.body

  res.locals.username = username
  res.locals.email = email

  if (!(username && password && email && confirm)) {
  	return res.render('register', {msg: '请输入完整信息'})
  }

  if (password !== confirm) {
  	return res.render('register', {msg: '两次密码不一致'})
  }

  if (!agree) {
  	return res.render('register', {msg: '必须同意协议'})
  }

  User.findOne({ where: { username } })
    .then(res => {
    	if (res) throw new Error('用户名已存在')

    	return User.findOne({ where: { user_email: email } })
    })
    .then(res => {
    	if (res) throw new Error('邮箱已存在')

    	const user = new User()
      const salt = bcrypt.genSaltSync(10)
      user.username = username
      user.user_email = email
      user.password = bcrypt.hashSync(password, salt)
      user.create_time = Date.now() / 1000
      user.update_time = Date.now() / 1000

      const code = uuid().slice(0, 8)
      user.user_email_code = code
      // console.log(code.slice(0,8))
      return user.save()
    })
    .then(data => {
    	if (!data.user_id) throw new Error('注册失败')
      const code = data.user_email_code
      const activeLink = `http://localhost:3000/account/active?code=${code}`
      utils.sendEmail(email, '品优购', `<p><a href="${activeLink}">${activeLink}</a></p>`)
        .then(() => {
          res.redirect('/account/login')
        })
    })
    .catch(e => {
    	res.render('register', { msg: e.message })
    })
}

exports.active = (req, res, next) => {
  const { code } = req.query
  User.findOne({ where: { user_email_code: code } })
    .then(data => {
      if (data.user_id !== req.session.info.user_id) {
        const err = new Error('Not Found')
        err.status = 404
        return next(err)
      }

      data.is_active = '是'

      data.user_email_code = ''

      return data.save()
    })
    .then(user => {
      res.redirect('/admin/home')
    })
}
