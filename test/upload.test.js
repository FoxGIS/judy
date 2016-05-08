var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('上传模块', function() {

  var nick_access_token
  var upload_id

  before('注册用户',function(done){
    request(app)
        .post('/api/v1/users')
        .send({ username: 'nick', password: '123456' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          nick_access_token = res.body.access_token

          done()
        })
  })

  after('清理', function() {
    User.remove({ username: 'nick' }).exec()
    Upload.remove({ owner: 'nick' }).exec()
  })

  describe('上传文件', function() {
    it('上传成功', function(done) {
      request(app)
        .post('/api/v1/uploads/nick')
        .set('x-access-token', nick_access_token)
        .attach('aa', './test/fixtures/create.txt')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.filename.should.equal('create.txt')
          res.body.upload_id.should.exist
          should.not.exist(res.body.file_id)
          should.not.exist(res.body.is_deleted)

          upload_id = res.body.upload_id

          done()
        })
    })
  })

  describe('获取上传列表', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick')
        .set('x-access-token', nick_access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.forEach(function(upload) {
            upload.owner.should.equal('nick')
          })

          done()
        })
    })
  })

  describe('获取上传状态', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/' + upload_id)
        .set('x-access-token', nick_access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.complete.should.exist
          res.body.progress.should.exist

          done()
        })
    })
  })

  describe('下载文件', function() {
    it('下载成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/' + upload_id + '/raw')
        .set('x-access-token', nick_access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('application/octet-stream')

          done()
        })
    })
  })

  describe('删除文件', function() {
    it('删除成功', function() {
      request(app)
        .delete('/api/v1/uploads/nick/' + upload_id)
        .set('x-access-token', nick_access_token)
        .expect(204)
    })
  })
})
