const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config()
const adminController = require('./src/Controllers/admin.controller');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {

    app.listen(process.env.PORT || 7778, function () {
        adminController.Admin("", "");
    })

}).catch(error => console.log(error));