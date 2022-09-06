const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RegistroSchema = Schema({
    Admin: String,
    fecha: Date,
    accion: String,
    UUID: String
});
module.exports = mongoose.model('historialRecords', RegistroSchema);

