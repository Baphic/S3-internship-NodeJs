const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RegistroSchema = Schema({
    nombre: String,
    UUID: String
});
module.exports = mongoose.model('historial', RegistroSchema);

