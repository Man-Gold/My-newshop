

const { Goods, UserCart } = require('../models')

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

exports.cart_add = (req, res, next) => {
  let { goods_id, amount = 1 } = req.query
  goods_id = ~~goods_id
  amount = ~~amount

  if (!goods_id) {
  	const err = new Error('没有这商品')
  	err.status = 404
  	next(err)
  }

  Goods.findOne({ where: { goods_id }})
    .then(data => {
      if (!data) throw new Error('商品不存在')

      res.locals.goods = data

      if (!req.session.info) {
      	return req.cookies.cart_list || []
      }
      return getFromDatebase(req.session.info.user_id)
    })
    .then(data => {
      const exists = data.find(v => v.id === goods_id)

      if (exists) {
      	exists.amount += amount
      } else {
      	data.push({id: goods_id, amount: amount})
      }

      if (!req.session.info) {
      	return res.cookie('cart_list', data, { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
      }

      return UserCart.update({ cart_info: JSON.stringify(data)}, { where: { user_id: req.session.info.user_id} })
    })
    .then(() => {
      res.render('cart-add')
    })
}