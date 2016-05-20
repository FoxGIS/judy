var express = require('express')
var multer = require('multer')
var util = require('util')
var auth = require('./controllers/auth')
var users = require('./controllers/user')
var styles = require('./controllers/style')
var tilesets = require('./controllers/tileset')
var fonts = require('./controllers/font')
var sprites = require('./controllers/sprite')
var files = require('./controllers/file')
var admin = require('./controllers/admin')


var router = express.Router()
var upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200000000, files: 1 }
})

var floatPattern = '[+-]?(?:\\d+|\\d+\.?\\d+)'
var staticPattern = '/static/%s:scale(@[23]x)?\.:format([\\w\\.]+)'
var centerPattern = util.format(':lon(%s),:lat(%s),:z(\\d+)/:width(\\d+)x:height(\\d+)',
  floatPattern, floatPattern)
var boundsPattern = util.format(':minx(%s),:miny(%s),:maxx(%s),:maxy(%s)/:z(\\d+)',
  floatPattern, floatPattern, floatPattern, floatPattern)

// 用户
router.post('/users', users.create)
router.get('/users/:username', auth, users.retrieve)
router.patch('/users/:username', auth, users.update)
router.post('/users/:username', users.login)

// 样式
router.get('/styles', styles.search)
router.get('/styles/:username', auth, styles.list)
router.post('/styles/:username', auth, styles.create)
router.get('/styles/:username/:style_id', auth, styles.retrieve)
router.patch('/styles/:username/:style_id', auth, styles.update)
router.delete('/styles/:username/:style_id', auth, styles.delete)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, styles.preview)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, styles.preview)

// 瓦片集
router.get('/tilesets', tilesets.search)
router.get('/tilesets/:username', auth, tilesets.list)
router.get('/tilesets/:username/:tileset_id', auth, tilesets.retrieve)
router.patch('/tilesets/:username/:tileset_id', auth, tilesets.update)
router.delete('/tilesets/:username/:tileset_id', auth, tilesets.delete)
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+).vector.pbf', auth, tilesets.getTile)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, tilesets.preview)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, tilesets.preview)

// 字体
router.get('/fonts/:username', auth, fonts.list)
router.get('/fonts/:username/:fontstack/:range.pbf', auth, fonts.retrieve)

// 符号库
router.get('/sprites/:username', auth, sprites.list)
router.post('/sprites/:username', auth, upload.any(), sprites.create)
router.get('/sprites/:username/:sprite_id', auth, sprites.retrieve)
router.patch('/sprites/:username/:sprite_id', auth, sprites.update)
router.delete('/sprites/:username/:sprite_id', auth, sprites.delete)
router.get('/sprites/:username/:sprite_id/sprite:scale(@[2]x)?.:format([\\w\\.]+)?', auth, sprites.download)

// 文件库
router.get('files/:username', auth, files.list)
router.post('files/:username', auth, upload.any(), files.create)
router.get('files/:username/:file_id', auth, files.retrieve)
router.patch('files/:username/:file_id', auth, files.update)
router.delete('files/:username/:file_id', auth, files.delete)
router.get('/uploads/:username/:file_id/raw', auth, files.download)

// 行政区划
router.get('/admin.json', admin.retrieve)

module.exports = router
