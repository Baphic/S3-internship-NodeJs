const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var requestsSchema = Schema({
    usuario: String,
    fecha: Date,
    descripcion: String,
    nombre: String,
    UUID: String,
    estado: String,
    fechaEstado: Date
});
module.exports = mongoose.model('requests', requestsSchema);