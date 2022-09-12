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
api.get("/listDataBucket", aut.Auth, requester.listData);
api.get("/listDataBucketTemporal", aut.Auth, requester.listDataTermporal);
api.get("/listDataDirectorioBucket/:directorio", aut.Auth, requester.listDataDirectorio);
api.get("/listDataDirectorioBucketTemporal", aut.Auth, requester.listDataDirectorioTemporal);
api.post('/uploadDataBucket', upload.array('file'), aut.Auth, requester.uploadData);


// Opciones del Administrador
api.post('/addFolder', aut.Auth, admin.addCarpeta);
api.delete("/eliminarData", aut.Auth, admin.eliminarData);
api.put('/approveRequest', aut.Auth, admin.aprobarSolicitud);
api.put('/denyRequest', aut.Auth, admin.negarSolicitud);
api.get("/downloadData", admin.descargarData);
api.put('/newAdmin/:idReq', aut.Auth, admin.addAdmin);
api.put('/oldRequester/:idAdm', aut.Auth, admin.removeAdmin);

api.get('/solicitudes', aut.Auth, admin.listSolicitudes);
api.get('/solicitudesAprobadas', aut.Auth, admin.listAprobados);
api.get('/solicitudesDenegadas', aut.Auth, admin.listDenegados);

// Otros
api.post('/reupload', admin.reuploadPrincipal)

module.exports = api;