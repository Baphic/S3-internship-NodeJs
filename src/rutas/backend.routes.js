const express = require('express');
const requester = require('../controladores/Requester.controller');

var api = express.Router();

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

api.get('/listDataBucket', requester.listData);
api.get('/downloadData/:fileName', requester.descargarData);
api.delete('/elimarData/:fileName', requester.elimarData);

module.exports = api;
