const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = Schema({
    name: String,
    surname: String,
    email: String,
    user: String,
    rol: String,
    password: String
});
module.exports = mongoose.model('users', usersSchema);

