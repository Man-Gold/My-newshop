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

#### 自动登录中间件

需求：如果用户登录时点击了自动登录，下次访问时我们要用cookie中的信息为用户登录

实现：

1.因为用户下次可能访问任何页面，所以该操作需要放置在中间件里，每个请求都需要经过

2.如果当前用户没有登录，判断请求的cookie中有没有info，没有就next，如果有就取出cookie中信息，为用户登录，再next

#### 模板公用部分提取

需求：因为多个页面只有版心部分不同，所以可以提取出公共部分便于维护，并且我们需要动态获取侧边栏的商品分类列表

实现：

1.将公共部分提取到 layout.hbs中，在每个用到的文件中，通过{{!<  layout}}将该页内容导出

2.将每个不同的版心中，共同的部分提取出来，放置到partials文件夹下，并补全模板配置，将提取出来的内容在需要的文件中通过{{> 文件名}}导入

3.编写异步的‘categories ’ helper，在模板渲染的时候来获取商品分类列表，由于数据在数据库中是并列存放的，我们需要根据cart_id和cart_pid来判断信息的归属关系，并且需要一个三级的数组结构来遍历，因此使用递归，代码如下：

```js
      var fun = function (level) {
        return data.filter(v => {
          return v.cat_pid === level
        })
        .map(v => {
          v.children = fun(v.cat_id)
          return v
        })
      }
```

#### 分类商品展示

需求：点击不同的商品分类，需要展示当前分类下商品，并且需要分页展示

实现：

1.使用req.originalUrl取出当前请求url地址，并绑定到locals上面

2.先根据url参数中的的cat_id在Category中查找该分类为几级分类

3.根据url中的page(默认为1)，sort(默认为时间),和查找出来的几级分类在Goods表中取出相应数据,

默认一次取出5条数据，offset为(page - 1)*5

4.再查找当前分类下共多条数据，计算出总页数

5.编写‘pagination’，helper来实现分页功能,逻辑如下：

> 1.不同页数的请求地址，只是page参数不同，其他一样，所以在helper中通过this取出locals中的originalUrl，并使用内置的url模块进行解析(url.parse)，解析后成为一个地址对象，page在对象的query属性中，通过更改query中的page，*必须要删除掉地址对象中的search属性，再使用url.format生成一个新的地址
>
> ```js
>   const urlObj = url.parse(this.originalUrl, true)
>
>   function getPage (page) {
>     urlObj.query.page = page
>     delete urlObj.search
>     return url.format(urlObj)
>   }
> ```
>
> 2.默认下面显示5个页码，并且根据当前页码动态改变
>
> ```js
>   const visibles = 5
>   const regin = Math.floor(visibles / 2)
>   //start为起始页码
>   let start = current - regin
>   start = start < 1 ? 1 : start
>   //end为结束页码
>   let end = start + visibles - 1
>   end = end > total ? total : end
>
>   start = end - visibles + 1
>   start = start < 1 ? 1 : start
> ```
>
> 3.分页部分的结构通过拼接字符串，使用 return new hbs.SafeString(字符串)将字符串返回给模板解析

#### 商品详情信息展示

需求：点击商品，进入商品详情页，展示该商品信息

实现：

1.根据url中的id参数，在goods表中查找该商品信息

2.在goods_pics中将对应id的图片地址信息找出，绑定到locals上(在hbs中，使用array.n来获取数组中索引n的元素)

3.根据商品数据中的不同分类级别的id，在Category表中查找出每个分类级别名称

#### 个人信息页

需求：该页面展示用户个人信息，并且提供更改功能，包括头像上传，form表单域信息提交，文本域

实现：

> 1.将form添加属性`enctype="multipart/form-data"` ,input标签的type属性为file，并且添加change事件
>
> 2.使用FileReader构造函数来实现图片预览
>
> ```js
> $(function($){
>     $('#avatar').on('change', function(){
>       var $this = $(this)
>       取到上传的第一个文件对象
>       var file = $(this).prop('files')[0]
>       var reader = new FileReader()
>       reader.readAsDataURL(file)
> 	 
>       reader.onload = function () {
>          $this.prev().fadeOut(function () {
>            $(this).attr('src', reader.result).fadeIn()
>          })
>        }
>     })
>   })
> ```
>
> 3.表单信息提交，使用fs模块的fs.rename来改变文件地址
>
> 4.使用util模块将异步的fs.rename变成promise模式
>
> 5.使用multer模块来处理表单文件
>
> > 1.配置multer
> >
> > ```js
> > dest为文件保存位置，如果不写则文件将保存在内存中，永远不会写入磁盘。
> > upload = multer({ dest: 'public/uploads' })
> >
> >
> > upload.single('avatar')
> > 接受带有名称的单个文件fieldname。单个文件将被存储在req.file。
> > ```
>
> 6.根据id查找用户信息，取出表单提交数据，使用Object.assign来合并两个对象，并重新持久化
>
> 7.将session里面和locals里面的用户信息更新

#### 添加商品到购物车

需求：点击添加到购物车，将选中商品数量和id存入cookie中(登录前)或者数据库中(登陆后)，并跳转到提示信息页

实现：

1.根据商品id在goods表中查询出商品信息

2.取出cookie中购物车信息或者数据库中购物车信息

3.遍历购物车信息数组，种类相同则amount相加，否则添加新数组项

4.封装一个函数，用来从数据库中取出购物车信息

```js
function getFromDatebase (user_id) {
  如果数据库中没有购物车信息，则创建一个
  return UserCart.findOrCreate({
    where: { user_id },
    defaults: {
      user_id: user_id,
      cart_info: '[]',
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    }
  })
  返回的数据是一个数组，第一个元素是数据，第二个元素true为创建出来的数据，false为查询出来的数据
  .then(([ cart, created ]) => {
  	let cartList = []
  	try {
      如果是创建出来的数据，cart.cart_info为空，json.parse会报错
  	  cartList = JSON.parse(cart.cart_info)
  	} catch (e) {
  	  cartList = []
  	}
  	return cartList
  })
}
```

5.将新的购物车信息数组存入cookie中或者数据库中

#### 中间件来查询出购物车商品信息

需求：因为页面侧边需要展示购物车信息，所以我们需要一个中间件来查询出来购物车的一些信息

实现：

1.Promise.resolve()开启一个promise链

2.取出cookie中或者数据库中购物车信息

3.promise.all来同时一起回调多个商品信息查找的异步操作

4.将商品信息绑定到locals

5.计算出商品总价和总数量

```js
res.locals.cartTotalPrice = data.reduce((prev, next) => prev + next.total, 0)
res.locals.cartTotalCount = data.reduce((prev, next) => prev + next.amount, 0)
```

#### 登陆后购物车信息同步到数据库

需求：登录前的购物车信息存储在cookie中的cart_List里，登陆后的购物车信息存储在数据库的user_cart表中，在用户登陆后，需要将cookie中的信息存储在数据库中

实现：在用户登录验证成功后，跳转之前，进行数据存储，封装syncCart函数（login.js）

1.取出cookie中信息

2.根据用户id在数据库中查找用户购物车信息（因为是用户如果第一次登录，数据库中不存在购物车信息，所以查找时使用findOrCreate）

3.遍历cookiecartlist，若dbcartlist中存在同样商品，则数量相加，反之添加整个元素

```js
    cookieCartList.forEach(v => {
      const exists = dbCartList.find(c => v.id === c.id)
      if (exists) {
        exists.amount += v.amount
      } else {
        dbCartList.push(v)
      }
    })
```



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





