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

需求：用户点击结算，需要生成订单，并且跳转到订单信息页

实现：

1.先创建一个订单，因为订单编号需要一定的随机性，封装函数(getOrderNumber)

2.根据新创建的订单id和cartList里面的商品id、购买信息，创建订单商品信息数据(创建多条数据，因此为多个异步操作，使用promise.all来统一多个异步的回调)

3.删除数据库中购物车表中的信息

4.将该订单的订单编号放到url地址参数中，重定向到对应的的订单信息页

5.根据url地址中的参数查找订单id

6.根据订单id在订单商品信息表中查询出商品id

7.根据商品id在goods表中查询对应商品信息(promise.all)







