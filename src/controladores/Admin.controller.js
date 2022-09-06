const Usuario = require('../modelos/usuarios.model');
const Registros = require("../modelos/registros.model");
const Solicitudes = require("../modelos/solicitudes.model");

const bcrypt = require('bcrypt-nodejs');
const jwt = require('../servicios/jwt.tokens');
const fs = require('fs')
const uuid = require("uuid").v4;

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

    if ((parametros.usuario || parametros.email) && parametros.password) {
        if (parametros.usuario) {
            Usuario.findOne({ usuario: parametros.usuario }, (error, usuarioEncontrado) => {
                if (error) return res.status(500).send({ mensaje: "Error en la petición1" });
                if (usuarioEncontrado) {

                    bcrypt.compare(parametros.password, usuarioEncontrado.password, (error, verificacionPassword) => {
                        if (error) return res.status(500).send({ mensaje: "Error en la petición2" });
                        if (verificacionPassword) {

                            if (parametros.Token === "true") {
                                return res.status(200).send({ token: jwt.crearToken(usuarioEncontrado),usuarioEncontrado })
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

require("dotenv").config();
const aws = require("aws-sdk");
const { Amazon } = require("aws-sdk");
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const sThree = new aws.S3({
    accessKeyId: process.env.ACCESS,
    secretAccessKey: process.env.SECRET
});

function aprobarSolicitud(req, res) {
    var min = req.user;
    var idSo = req.params.idSo;
    var fecha = new Date();
    var historial = new Registros();

    if (min.rol == "Admin") {

        Solicitudes.findById(idSo, (error, SolEn) => {
            if (error) res.status(500).send({ error: "error en la petición2" });
            if (!SolEn) res.status(500).send({ error: "No existe esta Solicitud" })

            const status = "Aprovado";
            const UUID = SolEn.UUID;

            Solicitudes.findByIdAndUpdate(idSo, { estado: status }, { new: true }, (error, solApr) => {
                if (error) return res.status(500).send({ mesaje: "Error de la petición3" });
                if (!solApr) return res.status(500).send({ mensaje: "Error al Denegar" });

                historial.Admin = min.usuario;
                historial.fecha = fecha;
                historial.accion = "Aprovar Solicitud"
                historial.UUID = UUID;

                historial.save((error, newRequest) => {
                    if (error) return res.status(500).send({ mesaje: "Error de la petición4" });
                    if (!newRequest) return res.status(500).send({ mensaje: "Error al registrar " });

                    reuploadPrincipalGet(UUID);

                    return res.send({ Inicio: newRequest })
                })
            })
        })

    } else {
        return res.status(500).send({ ERROR: "Acceso solo para Admins" });
    }
}

////////////////////////////////////////////////////
function reuploadPrincipalGet(UUID, res) {
    const bucket = process.env.BUCKET_REQUESTER;

    var path = UUID;
    var params = {
        Bucket: bucket,
        Key: path
    }
    //console.log(params)

    sThree.getObject(params, (error, object) => {
        //console.log(object);

        fs.writeFile('temp/' + path, object.Body, 'binary', (err) => {
            if (err) res.status(500).send({ error: "error en la petición2" });

            reuploadPrincipal(path);
        })
    })
}

function reuploadPrincipal(path, res) {
    const bucket = process.env.BUCKET;

    fs.readFile('temp/' + path, (error, data) => {

        var params = {
            Bucket: bucket,
            Key: path,
            Body: data
        }
        //console.log(data);

        sThree.putObject(params, (error, dataUpload) => {
            if (error) res.status(500).send({ error: "error en la petición3" });
            if (!dataUpload) res.status(500).send({ error: "No se subio nada" })

            reuploadPrincipalDelete(path)

            return { 2: dataUpload.length }
        })
    })
}

function reuploadPrincipalDelete(path, res) {
    const bucket = process.env.BUCKET_REQUESTER;

    fs.unlink('temp/' + path, (error) => {
        if (error) {
            console.error(error)
        }

        var params = {
            Bucket: bucket,
            Key: path
        }

        sThree.deleteObject(params, (error, dataDelete) => {
            if (error) res.status(500).send({ error: "error en la petición3" });
            if (!dataDelete) res.status(500).send({ error: "No se subio nada" })

            return ({ conclusion: "funciona" });
        })
    })
}
////////////////////////////////////////////////////

function negarSolicitud(req, res) {
    const min = req.user;
    var idSo = req.params.idSo;
    var fecha = new Date();
    var historial = new Registros();

    if (min.rol == "Admin") {

        Solicitudes.findById(idSo, (error, SolEn) => {
            if (error) res.status(500).send({ error: "error en la petición2" });
            if (!SolEn) res.status(500).send({ error: "No existe esta Solicitud" })

            const status = "Denegado";

            Solicitudes.findByIdAndUpdate(idSo, { estado: status }, { new: true }, (error, solDen) => {
                if (error) return res.status(500).send({ mesaje: "Error de la petición3" });
                if (!solDen) return res.status(500).send({ mensaje: "Error al Denegar" });

                historial.Admin = min.usuario;
                historial.fecha = fecha;
                historial.accion = "Denegar Solicitud"
                historial.UUID = SolEn.UUID;

                historial.save((error, newRecord) => {
                    if (error) return res.status(500).send({ mesaje: "Error de la petición4" });
                    if (!newRecord) return res.status(500).send({ mensaje: "Error al registrar " });

                    return res.status(200).send({ Negacion: solDen, Registro: newRecord });
                })
            })
        })

    } else {
        return res.status(500).send({ ERROR: "Acceso solo para Admins" });
    }
}

/*
    ADMIN:
    Aprobar solicitudes: Borrar la solicitud del bucket temporal, copiarlo en el principal, cambiar su estado a Aprobado, 
    guarda el hecho en el historial de registros.
    Denegar solicitudes: Cambiar su estado a Denegado, (POR POCA INFORMACIÓN AL RESPECTO) dejarlo en el bucket temporal,
    guardar el hecho en el historial de registros.
*/

/*
using (client)
{
    var existingObject = client.ListObjects(requestForExisingFile).S3Objects; 
    if (existingObject.Count == 1)
    {
        var requestCopyObject = new CopyObjectRequest()
        {
            SourceBucket = BucketNameProd,
            SourceKey = objectToMerge.Key,
            DestinationBucket = BucketNameDev,
            DestinationKey = newKey
        };
        client.CopyObject(requestCopyObject);
    }
}

with client being something like

var config = new AmazonS3Config { CommunicationProtocol = Protocol.HTTP, ServiceURL = "s3-eu-west-1.amazonaws.com" };
var client = AWSClientFactory.CreateAmazonS3Client(AWSAccessKey, AWSSecretAccessKey, config);

//////////

from cloudpathlib import CloudPath

source = CloudPath("s3://bucket1/source.txt")
destination = CloudPath("s3://bucket2/destination.txt")

# create the source file
source.write_text("hello!")

# destination does not exist
destination.exists()
#> True

# move the source file
source.copy(destination)
#> S3Path('s3://bucket2/destination.txt')

# destination now exists
destination.exists()
#> True

# it has the expected content
destination.read_text()
#> 'hello!'

*/

function historial(req, res) {
    Registros.find((error, allRe) => {
        if (error) return res.status(500).send({ mensaje: "Error de la petición" });
        if (!allRe) return res.status(500).send({ mensaje: "Error, no se encontraron Registros" });

        Solicitudes.find((error, allSo) => {
            if (error) return res.status(500).send({ mensaje: "Error de la petición" });
            if (!allSo) return res.status(500).send({ mensaje: "Error, no se encontraron Solicitudes" });

            return res.status(200).send({ historialRequester: allRe, historialAdmin: allSo });
        })
    })

}

module.exports = {
    Admin,
    Login,
    Register,
    addAdmin,
    removeAdmin,
    negarSolicitud,
    aprobarSolicitud,
    historial,
    reuploadPrincipal, reuploadPrincipalGet, reuploadPrincipalDelete
}