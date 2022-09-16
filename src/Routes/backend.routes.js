const express = require('express');
const requester = require('../Controllers/requester.controller');
const admin = require('../Controllers/admin.controller');
const multer = require("multer");
const aut = require('../Middleware/autentificacion');

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


// Opciones Generales
api.post('/login', admin.Login);
api.post('/register', aut.Auth, admin.Register);

// Opciones del Requester
api.get("/dataBucket", aut.Auth, requester.listData);
api.get("/dataBucketTemporal", aut.Auth, requester.listDataTemporal);
api.get("/dataDirectorioBucket/:directory", aut.Auth, requester.listDataDirectory);
api.get("/dataDirectorioBucketTemporal", aut.Auth, requester.listDataDirectoryTemporal);
api.post('/dataBucket', upload.array('file'), aut.Auth, requester.uploadData);

// Opciones del Administrador
api.post('/folder', aut.Auth, admin.addFolder);
api.delete("/data", aut.Auth, admin.deleteData);
api.put("/approveRequest/:folder/:file", admin.approveRequest);
api.put("/denyRequest/:folder/:file", admin.denyRequest);
api.get("/data/:folder/:file", aut.Auth, admin.downloadData);
api.delete('/file/:file', aut.Auth, admin.deletee);
api.put('/newAdmin/:idReq', aut.Auth, admin.addAdmin);
api.put('/oldRequester/:idAdm', aut.Auth, admin.removeAdmin);
api.get('/requests', aut.Auth, admin.listRequests);
api.get('/approvedRequests', aut.Auth, admin.listApprovedRequests);
api.get('/deniedRequests', aut.Auth, admin.listDeniedRequests);

module.exports = api;