
const express = require('express');
const requester = require('../controladores/Requester.controller');
const admin = require('../controladores/Admin.controller');
const multer = require("multer");
const aut = require('../middlewares/autentificacion');


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
  limits: { fileSize: 1000000000, files: 20 },
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

api.get("/listDataBucket", requester.listData);

api.get("/downloadData/:fileName", requester.descargarData);
api.delete("/elimarData/:fileName", requester.elimarData);
//api.get('/listFoldersBucket', requester.listCarpetas);
api.post('/addFolder', requester.addCarpeta);
api.post('/uploadDataBucket', upload.array('file'), aut.Auth, requester.uploadData);

api.post('/login', admin.Login);
api.post('/registro', admin.Register);

api.put('/newAdmin/:idReq', admin.addAdmin);
api.put('/oldRequester/:idAdm', admin.removeAdmin);

api.put('/approveRequest/:idSo', aut.Auth, admin.aprobarSolicitud);
api.put('/denyRequest/:idSo', aut.Auth, admin.negarSolicitud);

api.post('/reupload', admin.reuploadPrincipal)

api.get('/historial', admin.historial)

module.exports = api;
