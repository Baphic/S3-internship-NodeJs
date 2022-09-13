const express = require('express');
const cors = require('cors');
var app = express();

const Rutas = require('./src/Routes/backend.routes')

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use('/api', Rutas);


module.exports = app;