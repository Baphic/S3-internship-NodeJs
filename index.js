const mongoose = require('mongoose');
const app = require('./app');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {

    app.listen(7778, function () {
    })

}).catch(error => console.log(error));