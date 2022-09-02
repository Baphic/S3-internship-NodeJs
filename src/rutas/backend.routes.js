
const express = require('express');
const requester = require('../controladores/Requester.controller');
const admin = require('../controladores/Admin.controller');
const multer = require("multer")


var api = express.Router();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1000000000, files: 20},
  });

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

api.get("/listDataBucket", requester.listData);
api.get("/downloadData/:fileName", requester.descargarData);
api.delete("/elimarData/:fileName", requester.elimarData);
api.post('/uploadDataBucket', upload.array('file'), requester.uploadData);
api.get('/listFoldersBucket', requester.listCarpetas);
api.post('/addFolder', requester.addCarpeta);
api.post('/login', admin.Login);
api.post('/registro', admin.Register);
api.put('/newAdmin/:idReq', admin.addAdmin);
api.put('/oldRequester/:idAdm', admin.removeAdmin);

module.exports = api;
