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
  .forEach(item  => {
    const model = sequelize.import(path.join(__dirname, item))
    exports[model.name] = model
  })

// sequelize.import(path.join(__dirname, 'attribute.js'))
// sequelize.import(path.join(__dirname, 'attribute.js'))
// sequelize.import(path.join(__dirname, 'attribute.js'))
// sequelize.import(path.join(__dirname, 'attribute.js'))
