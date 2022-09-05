const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RegistroSchema = Schema({
    usuario: String,
    fecha: Date,
    descripcion: String,
    nombre: String,
    UUID: String
});
module.exports = mongoose.model('historial', RegistroSchema);

