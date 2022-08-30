const mongoose = require('mongoose');
const app = require('./app');

const adminController = require('./src/controladores/Admin.controller');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/PY1', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Se encuentra conectado a la base de datos de MongoDB");

    app.listen(7778, function () {
        console.log("Puerto 7778");
        adminController.Admin("", "");
        console.log("Usu:ADMIN, Pass:*****");
    })

}).catch(error => console.log(error));