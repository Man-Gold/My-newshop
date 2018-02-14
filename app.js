const path = require('path')
const url = require('url')

const express = require('express')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const hbs = require('express-hbs')

const session=require("express-session");

const routes = require('./router')

const app = express()

const { Category } = require('./models')

app.engine('hbs', hbs.express4({
  partialsDir: path.join(app.get('views'), 'partials')
}))
hbs.registerHelper('equal', function(a, b, opts) {
  return a === b ? opts.fn() : opts.inverse()
})
hbs.registerAsyncHelper('categories', function(opts, callback){
  Category.findAll({where: { cat_deleted: 0 } })
    .then(data => {
      var fun = function(level){
        return data.filter(v => {
          return v.cat_pid === level
        })
        .map(v => {
          v.children = fun(v.cat_id)
          return v
        })
      }
      const result = opts.fn({ categories: fun(0) })
      callback(result)
    })
})
hbs.registerHelper('pagination', function(current, total, opts){
  const urlObj = url.parse(this.originalUrl, true)

  function getPage(page){
    urlObj.query.page = page
    delete urlObj.search
    return url.format(urlObj)
  }

  const visibles = 5
  const regin = Math.floor(visibles / 2)

  let start = current - regin
  start = start < 1 ? 1 : start

  let end = start + visibles - 1
  end = end > total ? total : end

  start = end - visibles + 1
  start = start < 1 ? 1 : start

  let result = '<div class="sui-pagination pagination-large"><ul>'

      if ( current > 1) {
        result += `<li class="prev disabled"><a href="${getPage(current - 1)}">«上一页</a></li>`
      }

      if ( start > 1) {
        result += '<li class="dotted"><span>...</span></li>'
      }

      for (var i = start; i <= end; i++){
        const active = i === current ? 'class="active"' : ''
        result += `<li ${active}><a href="${getPage(i)}">${i}</a></li>`
      }

      if ( end < total ){
        result += '<li class="dotted"><span>...</span></li>'
      }

      if ( current < total ){
        result += `<li class="prev disabled"><a href="${getPage(current + 1)}">«下一页</a></li></ul>`
      }


      result += `<div>
              <span>共${total}页</span>
              <span>到第 <input type="text" class="page-num"> 页 <button class="page-confirm">确定</button></span>
            </div>
          </div>`

      return new hbs.SafeString(result)
})

hbs.registerHelper('allprice', (price, amount, opts) => {
  return (price*amount).toFixed(2)
})

hbs.registerHelper('mobileMask', function (input, opts) {
  return input.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
})
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')





// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))


app.use(session({
    secret: 'itcast',
    resave: false,
    saveUninitialized: true,
}))


// 挂载根路由
app.use(routes)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
