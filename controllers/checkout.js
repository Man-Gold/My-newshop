
const { Goods, UserCart, Order, OrderGoods, Consignee } = require('../models')

function getOrderNumber () {
  return Date.now() + Math.random().toString().substr(-5)
}

exports.create = (req, res, next) => {
  const { cartList, cartTotalPrice } = res.locals
  const orderNumber = getOrderNumber()
  Promise.resolve()
    .then(() => {
      if (!cartList.length) throw new Error('购物车为空')

      return Order.create({
      	user_id: req.session.info.user_id,
        order_number: orderNumber,
        consignee_addr: '',
        order_price: cartTotalPrice,
        create_time: Date.now() / 1000,
        update_time: Date.now() / 1000
      })
    })
    .then(data => {
      const saveTasks = cartList.map(v => {
      	const orderGoods = new OrderGoods()
      	orderGoods.order_id = data.order_id
        orderGoods.goods_id = v.id
        orderGoods.goods_price = v.price
        orderGoods.goods_number = v.amount
        orderGoods.goods_total_price = v.total
        return orderGoods.save()
      })
      return Promise.all(saveTasks)
    })
    .then(() => {
      return UserCart.update(
      	{ cart_info: '[]'},
      	{ where: {user_id: req.session.info.user_id } }
      	)
    })
    .then(() => {
    	res.redirect('/checkout?num=' + orderNumber)
    })
    .catch(e => {
    	e.status = 404
    	next(e)
    })
}

exports.index = (req, res, next) => {
  const { num } = req.query

  Promise.resolve()
  .then(() => {
  	if (!num) throw new Error('订单异常')
  	return Order.findOne({ where: { order_number: num } })
  })
  .then(data => {
  	if (!data) throw new Error('订单异常')
  		res.locals.order = data
  	return OrderGoods.findAll({ where: { order_id: data.order_id}})
  })
  .then(data => {
  	const tasks = data.map(v => {
  	  return Goods.findOne({ where: { goods_id: v.goods_id}})
  	    .then(goodsdata => {
  	    	return {
  	    	  image: goodsdata.goods_small_logo,
        name: goodsdata.goods_name,
        price: v.goods_price,
        amount: v.goods_number
  	    	}
  	    })
  	})
  	return Promise.all(tasks)
  })
  .then(data => {
  	res.locals.orderGoods = data

  	res.locals.orderTotalCount = data.reduce((p, n) => p + n.amount, 0)
  	return Consignee.findAll({ where: { user_id: req.session.info.user_id } })
  })
  .then(data => {
  	res.locals.consignee = data
  	res.render('checkout')
  })
  .catch(e => {
  	e.status = 404
  	next(e)
  })
}
