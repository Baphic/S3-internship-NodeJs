
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

// Opciones de Ambos
api.post('/login', admin.Login);
api.post('/registro', admin.Register);


// Opciones del Requester
api.get("/listDataBucket",  requester.listData);
api.get("/listDataBucketTemporal",  requester.listDataTermporal);
api.get("/listDataDirectorioBucket",  requester.listDataDirectorio);
api.get("/listDataDirectorioBucketTemporal",  requester.listDataDirectorioTemporal);
api.post('/uploadDataBucket', upload.array('file'), aut.Auth, requester.uploadData);


// Opciones del Administrador
api.post('/addFolder', requester.addCarpeta);
api.delete("/elimarData/:fileName", requester.elimarData);
api.put('/approveRequest/:idSo', aut.Auth, admin.aprobarSolicitud);
api.put('/denyRequest/:idSo', aut.Auth, admin.negarSolicitud);
api.get('/historial', admin.historial);
api.get("/downloadData/:fileName", requester.descargarData);
api.put('/newAdmin/:idReq', aut.Auth, admin.addAdmin);
api.put('/oldRequester/:idAdm', aut.Auth, admin.removeAdmin);

// Otros
api.post('/reupload', admin.reuploadPrincipal)

module.exports = api;
