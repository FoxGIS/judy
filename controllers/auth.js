var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Group = require('../models/group')


module.exports = function(req, res, next) {
  authAccessToken(req, res, function() {
    authResource(req, res, next)
  })
}


var authAccessToken = function(req, res, next) {
  var access_token = req.query.access_token ||
    req.cookies.access_token || req.headers['x-access-token']
  if (!access_token) {
    return res.status(401).json({ error: 'access_token缺失' })
  }


  jwt.verify(access_token, config.jwt_secret, function(err, decoded) {
    if (err) {
      return res.status(401).json(err)
    }

    User.findOne({ username: decoded.username }, function(err, user) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!user || user.access_token !== access_token) {
        return res.sendStatus(401)
      }

      req.user = user
      next()
    })
  })
}


var authResource = function(req, res, next) {
  var resourceType = req.url.split('/')[1]

  if (resourceType === 'users') {
    authUser(req, res, next)
  }

  if (resourceType === 'groups') {
    authGroup(req, res, next)
  }

  if (resourceType === 'uploads') {
    authUpload(req, res, next)
  }

  if (resourceType === 'styles') {
    authStyle(req, res, next)
  }

  if (resourceType === 'tilesets') {
    return next()
  }

  if (resourceType === 'fonts') {
    return next()
  }

  if (resourceType === 'sprites') {
    authSprite(req, res, next)
  }
}


var authUser = function(req, res, next) {
  var resourceUsername = req.url.split('/')[2]

  if (!resourceUsername) {
    return next()
  } else if (req.user.username === req.params.username
    || req.method === 'GET'){
    return next()
  }

  return res.sendStatus(401)
}


var authGroup = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()
  } else if (req.method !== 'GET') {
    return res.sendStatus(401)
  } else {
    return next()
  }
}


var authUpload = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()
  } else {
    return res.sendStatus(401)
  }
}


var authStyle = function(req, res, next) {
  var style_id = req.url.split('/')[3]

  if (req.user.username === req.params.username) {
    return next()
  } else if (req.method !== 'GET') {
    return res.sendStatus(401)
  } else if (!style_id){
    return next()
  } else {
    Style.findOne({
      owner: req.params.username,
      style_id: req.params.style_id,
      is_deleted: false
    }, function(err,style) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!style){
        return res.sendStatus(404)
      }

      if (style.scopes[0] === 'private') {
        return res.sendStatus(401)
      } else if (style.scopes[0] === 'public'){
        return next()
      } else {
        style.scopes.forEach(function(scope){
          Group.findOne({ groupname: scope}, function(err, group){
            if (err) {
              return res.status(500).json({ error: err})
            }

            if (!group) {
              return res.sendStatus(404)
            }


            if (group.members.indexOf(req.user.username) > -1){
              return next()
            } else {
              return res.sendStatus(401)
            }
          })
        })
      }
    })
  }
}


var authSprite = function(req, res, next) {
  var sprite_id = req.url.split('/')[3]

  if (req.user.username === req.params.username) {
    return next()
  } else if (req.method !== 'GET') {
    return res.sendStatus(401)
  } else if (!sprite_id){
    return next()
  } else {
    Sprite.findOne({
      owner: req.params.username,
      sprite_id: req.params.sprite_id,
      is_deleted: false
    }, function(err,sprite) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!sprite){
        return res.sendStatus(404)
      }

      if (sprite.scopes[0] === 'private') {
        return res.sendStatus(401)
      } else if (sprite.scopes[0] === 'public'){
        return next()
      } else {
        sprite.scopes.forEach(function(scope){
          Group.findOne({ groupname: scope}, function(err, group){
            if (err) {
              return res.status(500).json({ error: err})
            }

            if (!group) {
              return res.sendStatus(404)
            }


            if (group.members.indexOf(req.user.username) > -1){
              return next()
            } else {
              return res.sendStatus(401)
            }
          })
        })
      }
    })
  }
}
