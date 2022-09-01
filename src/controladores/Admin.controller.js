const Usuario = require('../modelos/usuarios.model');

const bcrypt = require('bcrypt-nodejs');
const jwt = require('../servicios/jwt.tokens');


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

function Login(req, res) {
    var parametros = req.body;

    if ((parametros.usuario || parametros.email) && parametros.password)

        if (parametros.usuario) {
            Usuario.findOne({ usuario: parametros.usuario }, (error, usuarioEncontrado) => {
                if (error) return res.status(500).send({ mensaje: "Error en la petición1" });
                if (usuarioEncontrado) {

                    bcrypt.compare(parametros.password, usuarioEncontrado.password, (error, verificacionPassword) => {
                        if (error) return res.status(500).send({ mensaje: "Error en la petición2" });
                        if (verificacionPassword) {

                            if (parametros.Token === "true") {
                                return res.status(200).send({ token: jwt.crearToken(usuarioEncontrado) })
                            }
                        } else {
                            usuarioEncontrado.password = undefined;
                            return res.status(200).send({ error: "Contraseña y/o usuario incorrecto" })
                        }
                    })

                } else {
                    return res.status(500).send({ mensaje: "Error, este usuario no se encuentra registrado" })
                }
            })

        } else if (parametros.email) {
            Usuario.findOne({ email: parametros.email }, (error, usuarioEncontrado) => {
                if (error) return res.status(500).send({ mensaje: "Error en la petición" });
                if (usuarioEncontrado) {

                    bcrypt.compare(parametros.password, usuarioEncontrado.password, (error, verificacionPassword) => {

                        if (verificacionPassword) {

                            if (parametros.Token === "true") {
                                return res.status(200).send({ token: jwt.crearToken(usuarioEncontrado) })
                            }
                        } else {
                            usuarioEncontrado.password = undefined;
                            return res.status(200).send({ error: "Contraseña y/o email incorrecto" })
                        }
                    })

                } else {
                    return res.status(500).send({ mensaje: "Error, este correo no se encuentra registrado" })
                }
            })
        }
}

function Register(req, res) {
    var parametros = req.body;
    var usuarioModelo = new Usuario();

    if (parametros.nombre && parametros.apellido && parametros.usuario && parametros.email && parametros.password) {
        usuarioModelo.nombre = parametros.nombre;
        usuarioModelo.apellido = parametros.apellido;
        usuarioModelo.email = parametros.email;
        usuarioModelo.usuario = parametros.usuario;
        usuarioModelo.rol = "Requester";

        Usuario.find({ usuario: parametros.usuario }, (error, usuarioEncontrado) => {
            if (error) return res.status(500).send({ mensaje: "Error de la petición1" });
            if (usuarioEncontrado.length == 0) {

                Usuario.find({ email: parametros.email }, (error, usuarioEncontrado2) => {
                    if (error) return res.status(500).send({ mensaje: "Error de la petición2" });
                    if (usuarioEncontrado2.length == 0) {

                        bcrypt.hash(parametros.password, null, null, (error, passwordEncriptada) => {
                            if (error) return res.status(500).send({ mensaje: "Error de la petición3" });
                            usuarioModelo.password = passwordEncriptada;

                            usuarioModelo.save((error, usuarioGuardado) => {
                                if (error) return res.status(500).send({ mensaje: "Error de la petición4" });
                                if (!usuarioGuardado) return res.status(500).send({ mensaje: "Error, no se registro ninguna Empresa" });
                                return res.status(200).send({ Usuario: usuarioGuardado });
                            });
                        });
                    } else {
                        return res.status(500).send({ mensaje: "Este Correo ya se encuentra registrado" });
                    }
                });
            } else {
                return res.status(500).send({ mensaje: "Este Usuario ya se encuentra en uso" });
            }

        });
    }
}


function addAdmin(req, res) {
    var idReq = req.params.idReq;
    const role = "Admin";

    Usuario.findById(idReq, (error, reqEnc) => {
        if (error) res.status(500).send({ error: "error en la petición1" });
        if (!reqEnc) res.status(500).send({ error: "No existe este Requester" })

        Usuario.findByIdAndUpdate(idReq, { rol: role }, { new: true }, (error, reqUpd) => {
            if (error) return res.status(500).send({ mesaje: "Error de la petición2" });
            if (!reqUpd) return res.status(500).send({ mensaje: "Error al registrar" });

            return res.status(200).send({ Admin: reqUpd });
        })

    })
}

function removeAdmin(req, res) {
    var idAdm = req.params.idAdm;
    const role = "Requester";

    Usuario.findById(idAdm, (error, profeEn) => {
        if (error) res.status(500).send({ error: "error en la petición" });
        if (!profeEn) res.status(500).send({ error: "No existe este Admin" });

        Usuario.findByIdAndUpdate(idAdm, { rol: role }, { new: true }, (error, admUpd) => {
            if (error) return res.status(500).send({ mesaje: "Error de la petición2" });
            if (!admUpd) return res.status(500).send({ mensaje: "Error al degradar" });

            return res.status(200).send({ requester: admUpd });
        })

    })
}

module.exports = {
    Admin,
    Login,
    Register,
    addAdmin,
    removeAdmin
}