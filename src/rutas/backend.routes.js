const express = require('express');
const requester = require('../controladores/Requester.controller');
const admin = require('../controladores/Admin.controller');

var api = express.Router();

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3');

const BUCKET = process.env.BUCKET
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname)
        }
    })
})

api.get('/listDataBucket', requester.listData);
api.get('/downloadData/:fileName', requester.descargarData);
api.delete('/elimarData/:fileName', requester.elimarData);
api.post('/uploadDataBucket', upload.single('file'), requester.uploadData);

api.post('/login', admin.Login);
api.post('/registro', admin.Register);
api.put('/newAdmin/:idReq', admin.addAdmin);
api.put('/oldRequester/:idAdm', admin.removeAdmin);

api.get('/downloadData/:fileName', requester.descargarData);
api.delete('/elimarData/:fileName', requester.elimarData);
api.post('/uploadDataBucket', upload.single('file'), requester.uploadData);

module.exports = api;
