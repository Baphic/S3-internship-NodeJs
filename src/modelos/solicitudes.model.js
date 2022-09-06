const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SolicitudSchema = Schema({
    usuario: String,
    fecha: Date,
    descripcion: String,
    nombre: String,
    UUID: String,
    estado: String
});
module.exports = mongoose.model('historialRequests', SolicitudSchema);

