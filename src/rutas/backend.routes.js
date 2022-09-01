const express = require("express");
const requester = require("../controladores/Requester.controller");
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

module.exports = api;
