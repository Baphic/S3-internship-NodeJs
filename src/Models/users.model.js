const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = Schema({
    nombre: String,
    apellido: String,
    email: String,
    usuario: String,
    rol: String,
    password: String
});
module.exports = mongoose.model('users', usersSchema);

