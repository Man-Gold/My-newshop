module.exports = {
  mail: {
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    name: '品优购',
    auth: { user: 'it@zce.me', pass: 'wtfijkthhxuvbjjg' },
    connectionTimeout: 1000,
    greetingTimeout: 1000,
    socketTimeout: 2000,
    debug: process.env.NODE_ENV === 'development'
  }
}
