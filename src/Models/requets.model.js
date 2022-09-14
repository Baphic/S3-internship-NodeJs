const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var requestsSchema = Schema({
    user: String,
    date: Date,
    description: String,
    name: String,
    UUID: String,
    status: String,
    dateStatus: Date
});
module.exports = mongoose.model('requests', requestsSchema);