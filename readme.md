#### 登陆后购物车信息同步到数据库

需求：登录前的购物车信息存储在cookie中的cart_List里，登陆后的购物车信息存储在数据库的user_cart表中，在用户登陆后，需要将cookie中的信息存储在数据库中

实现：在用户登录验证成功后，跳转之前，进行数据存储，封装syncCart函数（login.js）

1.取出cookie中信息

2.根据用户id在数据库中查找用户购物车信息（因为是用户第一次登录，数据框中不存在购物车信息，所以查找时使用findOrCreate）

3.遍历cookiecartlist，若dbcartlist中存在同样商品，则数量相加，反之添加整个元素







