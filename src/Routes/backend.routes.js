const express = require('express');
const requester = require('../Controllers/requester.controller');
const admin = require('../Controllers/admin.controller');
const multer = require("multer");
const aut = require('../Middlewares/autentificacion');


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
api.post('/registro', aut.Auth, admin.Register);


// Opciones del Requester
api.get("/getDataBucket", aut.Auth, requester.listData);
api.get("/getDataBucketTemporal", aut.Auth, requester.listDataTemporal);
api.get("/getDataDirectorioBucket/:directorio", aut.Auth, requester.listDataDirectorio);
api.get("/getDataDirectorioBucketTemporal", aut.Auth, requester.listDataDirectorioTemporal);
api.post('/postDataBucket', upload.array('file'), aut.Auth, requester.uploadData);


// Opciones del Administrador
api.post('/postFolder', aut.Auth, admin.addFolder);
api.delete("/deleteData", aut.Auth, admin.deleteData);
api.put("/putApproveRequest/:folder/:file", admin.approveRequest);
api.put("/putDenyRequest/:folder/:file", aut.Auth, admin.denyRequest);
api.get("/getData/:folder/:file", aut.Auth, admin.dowloadData);
api.delete('/delelte/:file', aut.Auth, admin.deletee);
api.put('/putNewAdmin/:idReq', aut.Auth, admin.addAdmin);
api.put('/putOldRequester/:idAdm', aut.Auth, admin.removeAdmin);

api.get('/getRequests', aut.Auth, admin.listRequests);
api.get('/getRequestsApprove', aut.Auth, admin.listApprove);
api.get('/getRequestsDeny', aut.Auth, admin.listDeny);

// Otros

module.exports = api;