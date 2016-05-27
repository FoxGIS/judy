var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var async = require('async')
var sharp = require('sharp')
var Grid = require('gridfs-stream')
var Upload = require('../models/upload')


module.exports.list = function(req, res) {
  Upload.find({
    owner: req.params.username,
    is_deleted: false
  }, '-thumbnail', function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)
  })
}


module.exports.create = function(req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo)
  var writeStream = gfs.createWriteStream({
    filename: req.files.upload.originalFilename
  })
  fs.createReadStream(req.files.upload.path).pipe(writeStream)

  writeStream.on('error', function(err) {
    fs.unlink(req.files.upload.path)
    return res.status(500).json({ error: err })
  })

  writeStream.on('close', function(file) {
    var format = path.extname(file.filename).replace('.', '').toLowerCase()
    var newUpload = new Upload({
      file_id: file._id,
      owner: req.params.username,
      name: path.basename(file.filename, path.extname(file.filename)),
      size: req.files.upload.size,
      format: format
    })

    if (['png', 'jpg', 'jpeg', 'gif', 'tiff', 'tif'].indexOf(newUpload.format) < 0 ) {
      return res.status(200).json(newUpload)
    }
    else{
      fs.readFile(req.files.upload.path, function(err, imageBuffer) {
        fs.unlink(req.files.upload.path)
        var image = sharp(imageBuffer)

        async.parallel([
          function (callback) {
            image.resize(100, 100).quality(50).jpeg().toBuffer(function(err, buffer) {
              callback(err, buffer)
            })
          },

          function (callback) {
            image.metadata(function(err, metadata) {
              if (metadata.width <= 1000) {
                image.quality(50).jpeg().toBuffer(function(err, buffer) {
                  callback(err, buffer)
                })
              } else {
                image.resize(1000).quality(50).jpeg().toBuffer(function(err, buffer) {
                  callback(err, buffer)
                })
              }
            })
          }
        ],
        function(err, results){
          if (err) {
            return res.status(500).json({ error: err})
          }

          newUpload.mini_thumbnail = results[0]
          newUpload.thumbnail = results[1]

          newUpload.save(function(err){
            if (err) {
              return res.status(500).json({ error: err})
            }

            return res.status(200).json(_.omit(newUpload.toJSON(), ['thumbnail', 'mini_thumbnail']))
          })
        })
      })
    }
  })
}


module.exports.retrieve = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, '-thumbnail', function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    res.status(200).json(upload)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'tags', 'name', 'description', 'year', 'location']

  Upload.findOneAndUpdate({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    res.status(200).json(_.omit(upload.toJSON(), ['thumbnail']))
  })
}


module.exports.delete = function(req, res) {
  Upload.findOneAndUpdate({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    var readStream = gfs.createReadStream({ _id: upload.file_id })
    readStream.on('error', function(err) {
      return res.status(500).json({ error: err })
    })

    res.setHeader('Content-disposition', 'attachment; filename*=UTF-8\'\'' +
      encodeURIComponent(upload.name) + '.' + encodeURIComponent(upload.format))
    res.type(upload.format)
    readStream.pipe(res)
  })
}


module.exports.preview = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    res.set({ 'Content-Type': 'image/jpeg' })
    res.status(200).send(upload.thumbnail)
  })
}
