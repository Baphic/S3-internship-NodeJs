const Usuario = require('../modelos/usuarios.model');

const bcrypt = require('bcrypt-nodejs');

////////////////////////////////////////////////////////////////
// UNIVERSAL
////////////////////////////////////////////////////////////////
function Admin(res) {
    var adminModelo = new Usuario();
    adminModelo.nombre = "Back";
    adminModelo.apellido = "End";
    adminModelo.usuario = "ADMIN";
    adminModelo.rol = "Admin";

    Usuario.find({ rol: adminModelo.rol }, (error, findAdmin) => {
        if (error) return res.status(500).send({ mensaje: "Error de la petición1" });
        if (findAdmin.length == 0)
            bcrypt.hash('ADMIN', null, null, (error, passwordEncript) => {
                if (error) return res.status(500).send({ mensaje: "Error de la petición2" });
                adminModelo.password = passwordEncript;

                adminModelo.save((error, adminSave) => {
                    if (error) return res.status(500).send({ mensaje: "Error de la petición3" });
                    if (!adminSave) return res.status(500).send({ mensaje: "Error, no se creo ningun Admin" });

                });
            });
    });
}


module.exports = {
    Admin
}