const { Category, Goods, GoodsPics } = require('../models')

exports.home = (req, res) => {
  res.render('home')
}

exports.list = (req, res, next) => {
  const { cat_id } = req.params
  res.locals.originalUrl = req.originalUrl
  let { page = 1, sort = 'upd_time' } = req.query
  page = ~~page
  res.locals.page = page
  res.locals.sort = sort

  const limit = 5
  const offset = (page - 1) * limit

  let where = {}

  Category.findOne({ where: {cat_id} })
  .then(data => {
  	const level = data.cat_level === 0 ? 'cat_one_id' : data.cat_levle === 1 ? 'cat_two_id' : 'cat_three_id'
    where = { [level]: cat_id}
    const order = [
      [sort, 'DESC']
    ]
  	return Goods.findAll({where, limit, offset, order})
  })
  .then(data => {
  	res.locals.goods = data
    // res.send(data)
    return Goods.count({ where })
  })
  .then(data => {
    res.locals.totalPage = Math.ceil(data / limit)
    res.render('list')
  })
  .catch(next)
}

exports.item = (req, res, next) => {
  const { goods_id } = req.params
  res.locals.originalUrl = req.originalUrl
  Goods.findOne({ where: { goods_id } })
    .then(goods => {
      if (!goods) throw new Error('这个商品不存在')

      res.locals.goods = goods

      return GoodsPics.findAll({ where: { goods_id } })
    })
    .then(images => {
      res.locals.images = images
      return Category.findOne({ where: { cat_id: res.locals.goods.cat_one_id } })
    })
    .then(oneCategory => {
      res.locals.oneCategory = oneCategory
      return Category.findOne({ where: { cat_id: res.locals.goods.cat_two_id } })
    })
    .then(twoCategory => {
      res.locals.twoCategory = twoCategory
      return Category.findOne({ where: { cat_id: res.locals.goods.cat_three_id } })
    })
    .then(threeCategory => {
      res.locals.threeCategory = threeCategory
      res.render('item')
    })
    .catch(e => {
      e.status = 404
      next(e)
    })
}
