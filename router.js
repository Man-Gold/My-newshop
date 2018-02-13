const { Router } = require('express')
const account = require('./controllers/account')
const lg = require('./controllers/login')
const ho = require('./controllers/home')
const common = require('./controllers/common')
const { User } = require('./models')
const member = require('./controllers/member')
const cart = require('./controllers/cart')
const { Goods, UserCart } = require('./models')
const checkout = require('./controllers/checkout')

function getFromDatebase (user_id) {
  return UserCart.findOrCreate({
    where: { user_id },
    defaults: {
      user_id: user_id,
      cart_info: '[]',
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    }
  })
  .then(([ cart, created ]) => {
    let cartList = []
    try {
      cartList = JSON.parse(cart.cart_info)
    } catch (e) {
      cartList = []
    }
    return cartList
  })
}


const router = new Router()

router.use((req, res, next) => {
	if (!req.session.info) {
      if (req.cookies.info) {
      	const {uid, pwd} = req.cookies.info
        User.findOne({where: { user_id: uid } })
          .then(data => {
          	if (data.password !== pwd) throw new Error()
          	req.session.info = data
            res.locals.currentUser = data
            next()
          })
          .catch(() => {
          	res.redirect('/account/login')
          })
	  } else {
	  	next()
	  }
	} else {
    res.locals.currentUser = req.session.info
	  next()
	}
})

router.use((req, res, next) => {
  Promise.resolve()
  .then(() => {
    if (!req.session.info) {
      return req.cookies.cart_List || []
    }

    return getFromDatebase(req.session.info.user_id)
  })
  .then(data => {
    const promise = data.map(v => {
      return Goods.findOne({ where: { goods_id: v.id}})
        .then(goods => {
          return Object.assign({
            name: goods.goods_name,
            image: goods.goods_small_logo,
            price: goods.goods_price,
            total: goods.goods_price * v.amount
          }, v)
        })
    })
    return Promise.all(promise)
  })
  .then(data => {
    res.locals.cartList = data
    res.locals.cartTotalPrice = data.reduce((prev, next) => prev + next.total, 0)
    res.locals.cartTotalCount = data.reduce((prev, next) => prev + next.amount, 0)
    next()
  })
})


router.get('/home', ho.home)

router.get('/list/:cat_id(\\d+)', ho.list)

router.get('/item/:goods_id(\\d+)', ho.item)

router.get('/account/register', account.register)

router.post('/account/register', account.registerPost)

router.get('/account/login', lg.login)

router.post('/account/login', lg.loginPost)

router.get('/captcha', common.captcha)

router.get('/member', common.require, member.member)
router.get('/member/profile', common.require, member.member_profile)
router.post('/member/profile', common.require, member.member_profilePost)
router.get('/member/order', common.require, member.member_order)
router.get('/member/address', common.require, member.member_address)

router.get('/cart/add', cart.cart_add)
router.get('/cart', cart.cart)

router.get('/checkout/create', common.require, checkout.create)
router.get('/checkout', common.require, checkout.index)


module.exports = router