#### 项目搭建

1.express-generator生成基本的项目结构(需要为debug配置环境变量,来打印一些信息)

2.standard来统一代码风格(standard --fix可以修复代码)

3.set只能在window系统下设置环境变量，使用cross-env来实现跨平台设置环境变量

4.将hbs换成express-hbs，并按照淘宝镜像的官网配置

5.整合全部静态资源到 public 目录

6.使用 Sequelice 数据模型的方式访问数据库(由于已经有了数据库结构，借助sequelize-auto自动生成数据模型代码)

7.数据表模型载入，配置index.js页(glod来匹配路径，并且同步来执行)

```js
const path = require('path')

// 自动匹配路径
const glob = require('glob')
// ORM 框架
const Sequelize = require('sequelize')

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: '127.0.0.1',
  database: 'newshop2',
  username: 'root',
  password: '199619',
  logging: false,
  define: {
    timestamps: false
  }
})

glob.sync('*.js', { cwd: __dirname })
  .filter(item => item !== 'index.js')
  .forEach(item => {
    const model = sequelize.import(path.join(__dirname, item))
    exports[model.name] = model
  })
```

8.创建controllers文件夹，至此MVC思想的结构搭建完成(views-放置模板，models-数据控制，controllers-将数据与模板结合)

#### 注册

需求：用户提交数据，进行数据验证，数据持久化，并像用户邮箱发送验证信息

实现：

1.表单提交数据，后端进行数据验证

2.验证成功，用uuid生成唯一标示字符串，用bcryptjs来对密码进程加密处理

3.使用nodemailer来发送文件，配置发送者的信息

```js
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
```

4.邮件发送成功后，跳转到登录页

#### 登录

需求：验证登录信息，并验证验证码正确，如果用户点击自动登录，则一个月内访问网站时不需要再登录，如果用户是跳转过来，登录后需要跳转回去

实现：

1.如果是跳转过来，取出url参数中的redirect，并存入页面的隐藏域中，随着登录信息一起提交

2.访问登录页，使用svg-captcha来生成验证码,并将信息存入session

```js
const captcha = require('svg-captcha')

exports.captcha = (req, res) => {
  const svg = captcha.create()

  req.session.captcha = svg.text

  res.type('svg')
  res.send(svg.data)
}
```

3.信息提交后，验证登录信息，并验证验证码信息

4.登录成功后，如果自动登录，则将用户登录信息存入cookie中，设置生命周期为一个月

5.如果存在returnurl，则重定向到该地址



#### 登陆后购物车信息同步到数据库

需求：登录前的购物车信息存储在cookie中的cart_List里，登陆后的购物车信息存储在数据库的user_cart表中，在用户登陆后，需要将cookie中的信息存储在数据库中

实现：在用户登录验证成功后，跳转之前，进行数据存储，封装syncCart函数（login.js）

1.取出cookie中信息

2.根据用户id在数据库中查找用户购物车信息（因为是用户如果第一次登录，数据库中不存在购物车信息，所以查找时使用findOrCreate）

3.遍历cookiecartlist，若dbcartlist中存在同样商品，则数量相加，反之添加整个元素

#### 购物车结算页面

需求：在购物车结算页面展示购物车中所有商品（登录前cookie中cart_List里或者登陆后数据库里的信息）

实现：由于中间件中已经把购物车中商品信息存入locals，所以在模板中可以直接使用

1.在展示商品价钱时需要保留两位小数，因此编写helper(allprice)

#### 订单生成

需求：点击结算，需要生成订单，并且跳转到订单信息页

实现：

1.先创建一个订单，因为订单编号需要一定的随机性，封装函数(getOrderNumber)

2.根据新创建的订单id和cartList里面的商品id、购买信息，创建订单商品信息数据(创建多条数据，因此为多个异步操作，使用promise.all来统一多个异步的回调)

3.删除数据库中购物车表中的信息

4.将该订单的订单编号放到url地址参数中，重定向到对应的的订单信息页

5.根据url地址中的参数查找订单id

6.根据订单id在订单商品信息表中查询出商品id

7.根据商品id在goods表中查询对应商品信息(promise.all)

#### 添加地址

需求：点击添加地址，弹出模态框，填写信息为用户添加收货地址

实现：采用jquery的ajax异步操作，重新渲染局部页面

1.准备要地址部分的字符串模板(*由于js代码卸载hbs模板里面，字符串中的双花括弧需要转译，才不会被hbs模板解析)

2.利用jquery的serializeArray获取数组-对象形式的表单参数

3.用reduce将表单参数转换为json形式，并发送ajax请求，重新渲染页面

4.服务端配置路由，获取参数，并将信息持久化，再查找出该用户全部地址信息并返回





