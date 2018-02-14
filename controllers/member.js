

const fs = require('fs')
const path = require('path')
const util = require('util')
const multer = require('multer')

const { User, Consignee } = require('../models')
const upload = multer({ dest: 'public/uploads' })

const rename = util.promisify(fs.rename)


exports.member = (req, res) => {
  res.render('member')
}

exports.member_profile = (req, res) => {
  res.render('member-profile')
}


exports.member_profilePost = [upload.single('avatar'), (req, res) => {
  const { user_sex, user_qq, user_tel, user_xueli, user_hobby, user_introduce } = req.body

  const target = path.join(__dirname, `../public/uploads/avatar-${req.session.info.user_id}.png`)

  console.log(req.file.path)
  console.log(path.join(__dirname, '..', req.file.path))
  rename(path.join(__dirname, '..', req.file.path), target)
    .then(() => {
      return User.findById(req.session.info.user_id)
    })
    .then(data => {
      if (!data) throw new Error()
      Object.assign(data, { user_sex, user_qq, user_tel, user_xueli, user_hobby, user_introduce })

      return data.save()
    })
    .then(data => {
      if (!data) throw new Error()
      req.session.info = data
      res.locals.currentUser = data
      res.render('member-profile')
    })
    .catch(e => {
      res.render('member-profile', { msg:'更新失败'} )
    })
}]


exports.member_order = (req, res) => {
  res.render('member-order')
}


exports.member_address = (req, res) => {
  res.render('member-address')
}

exports.addAddress = (req, res, next) => {
  const { cgn_name, cgn_address, cgn_tel, cgn_code } = req.body

  Consignee.create({
    user_id: req.session.info.user_id,
    cgn_name,
    cgn_address,
    cgn_tel,
    cgn_code
  })
  .then(() => {
    return Consignee.findAll({ where: { user_id: req.session.info.user_id } })
  })
  .then(data => {
    res.send({ data })
  })
  .catch(e => {
    res.send({ error: e.message })
  })
}