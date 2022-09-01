const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UsuarioSchema = Schema({
    nombre: String,
    apellido: String,
    email: String,
    usuario: String,
    rol: String,
    password: String
});
module.exports = mongoose.model('usuarios', UsuarioSchema);

