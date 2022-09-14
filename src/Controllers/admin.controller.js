require("dotenv").config();
const express = require("express");
const user = require("../Models/users.model");
const request = require("../Models/requets.model");
const bcrypt = require("bcrypt-nodejs");
const jwt = require("../Services/jwt.tokens");
const fs = require("fs");
const uuid = require("uuid").v4;
const Amazon = require("aws-sdk");

const temporal = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
});
const sThree = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
});

// Creacion de Admin default
function Admin(res) {
  var adminModelo = new user();
  adminModelo.nombre = "Back";
  adminModelo.apellido = "End";
  adminModelo.user = "ADMIN";
  adminModelo.rol = "Admin";

  user.find({ rol: adminModelo.rol }, (error, findAdmin) => {
    if (error)
      return res.status(500).send({ mensaje: "Error de la petición1" });
    if (findAdmin.length == 0)
      bcrypt.hash("ADMIN", null, null, (error, passwordEncript) => {
        if (error)
          return res.status(500).send({ mensaje: "Error de la petición2" });
        adminModelo.password = passwordEncript;

        adminModelo.save((error, adminSave) => {
          if (error)
            return res.status(500).send({ mensaje: "Error de la petición3" });
          if (!adminSave)
            return res
              .status(500)
              .send({ mensaje: "Error, no se creó ningún Admin" });
        });
      });
  });
}

// Login para los administradores y requesters
function Login(req, res) {
  var parametros = req.body;

  if ((parametros.user || parametros.email) && parametros.password) {
    if (parametros.user) {
      user.findOne(
        { user: parametros.user },
        (error, userEncontrado) => {
          if (error)
            return res.status(500).send({ mensaje: "Error en la petición1" });
          if (userEncontrado) {
            bcrypt.compare(
              parametros.password,
              userEncontrado.password,
              (error, verificacionPassword) => {
                if (error)
                  return res
                    .status(500)
                    .send({ mensaje: "Error en la petición2" });
                if (verificacionPassword) {
                  if (parametros.Token === "true") {
                    return res.status(200).send({
                      token: jwt.crearToken(userEncontrado),
                      infoUser: userEncontrado,
                    });
                  }
                } else {
                  userEncontrado.password = undefined;
                  return res
                    .status(500)
                    .send({ mensaje: "Contraseña y/o user incorrecto" });
                }
              }
            );
          } else {
            return res.status(500).send({
              mensaje: "Error, este user no se encuentra registrado",
            });
          }
        }
      );
    } else if (parametros.email) {
      user.findOne(
        { email: parametros.email },
        (error, userEncontrado) => {
          if (error)
            return res.status(500).send({ mensaje: "Error en la petición" });
          if (userEncontrado) {
            bcrypt.compare(
              parametros.password,
              userEncontrado.password,
              (error, verificacionPassword) => {
                if (verificacionPassword) {
                  if (parametros.Token === "true") {
                    return res
                      .status(200)
                      .send({ token: jwt.crearToken(userEncontrado) });
                  }
                } else {
                  userEncontrado.password = undefined;
                  return res
                    .status(200)
                    .send({ error: "Contraseña y/o email incorrecto" });
                }
              }
            );
          } else {
            return res.status(500).send({
              mensaje: "Error, este correo no se encuentra registrado",
            });
          }
        }
      );
    }
  }
}

// Registro requesters
function Register(req, res) {
  var parametros = req.body;
  var userModelo = new user();

  if (
    parametros.nombre &&
    parametros.apellido &&
    parametros.user &&
    parametros.email &&
    parametros.password &&
    parametros.rol
  ) {
    userModelo.nombre = parametros.nombre;
    userModelo.apellido = parametros.apellido;
    userModelo.email = parametros.email;
    userModelo.user = parametros.user;
    userModelo.rol = parametros.rol;

    user.find(
      { user: parametros.user },
      (error, userEncontrado) => {
        if (error)
          return res.status(500).send({ mensaje: "Error de la petición1" });
        if (userEncontrado.length == 0) {
          user.find(
            { email: parametros.email },
            (error, userEncontrado2) => {
              if (error)
                return res
                  .status(500)
                  .send({ mensaje: "Error de la petición2" });
              if (userEncontrado2.length == 0) {
                bcrypt.hash(
                  parametros.password,
                  null,
                  null,
                  (error, passwordEncriptada) => {
                    if (error)
                      return res
                        .status(500)
                        .send({ mensaje: "Error de la petición3" });
                    userModelo.password = passwordEncriptada;

                    userModelo.save((error, userGuardado) => {
                      if (error)
                        return res
                          .status(500)
                          .send({ mensaje: "Error de la petición4" });
                      if (!userGuardado)
                        return res.status(500).send({
                          mensaje: "Error, no se registro ninguna Empresa",
                        });
                      return res.status(200).send({ user: userGuardado });
                    });
                  }
                );
              } else {
                return res
                  .status(500)
                  .send({ mensaje: "Este Correo ya se encuentra registrado" });
              }
            }
          );
        } else {
          return res
            .status(500)
            .send({ mensaje: "Este user ya se encuentra en uso" });
        }
      }
    );
  }
}

// Cambiar rol
function addAdmin(req, res) {
  var idReq = req.params.idReq;
  const role = "Admin";
  var ring = req.user.rol;

  if (ring == "Admin") {
    user.findById(idReq, (error, reqEnc) => {
      if (error) res.status(500).send({ error: "error en la petición1" });
      if (!reqEnc) res.status(500).send({ error: "No existe este Requester" });

      if (reqEnc.rol == "Admin")
        return res
          .status(500)
          .send({ requester: "Este user ya es rol Admin" });

      user.findByIdAndUpdate(
        idReq,
        { rol: role },
        { new: true },
        (error, reqUpd) => {
          if (error)
            return res.status(500).send({ mesaje: "Error de la petición2" });
          if (!reqUpd)
            return res.status(500).send({ mensaje: "Error al registrar" });

          return res.status(200).send({ Admin: reqUpd });
        }
      );
    });
  } else {
    return res.status(403).send({ ERROR: "Acceso solo para Admins" });
  }
}

function removeAdmin(req, res) {
  var idAdm = req.params.idAdm;
  const role = "Requester";
  var run = req.user.rol;

  if (run == "Admin") {
    user.findById(idAdm, (error, uEn) => {
      if (error) res.status(500).send({ error: "error en la petición" });
      if (!uEn) res.status(500).send({ error: "No existe este Admin" });

      if (uEn.rol == "Requester")
        return res
          .status(500)
          .send({ requester: "Este user ya es rol Requester" });

      user.findByIdAndUpdate(
        idAdm,
        { rol: role },
        { new: true },
        (error, admUpd) => {
          if (error)
            return res.status(500).send({ mesaje: "Error de la petición2" });
          if (!admUpd)
            return res.status(500).send({ mensaje: "Error al degradar" });

          return res.status(200).send({ requester: admUpd });
        }
      );
    });
  } else {
    return res.status(403).send({ ERROR: "Acceso solo para Admins" });
  }
}

const { Console } = require("console");

function approveRequest(req, res) {
  // var min = req.user;
  var folder = req.params.folder;
  var file = req.params.file;
  var fecha = new Date();

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }

  // if (min.rol == "Admin") {
  const status = "Aprobado";
  const UUID = data;

  request.findOneAndUpdate(
    { UUID: UUID },
    { estado: status, fechaEstado: fecha },
    { new: true },
    (error, solApr) => {
      if (error)
        return res.status(500).send({ mesaje: "Error de la petición3" });
      if (!solApr) return res.status(500).send({ mensaje: "Error al Aceptar" });

      if (UUID.includes("/") == true) {
        fs.mkdirSync("/" + UUID, { recursive: true });
      } else if (UUID.includes == false) {
        fs.mkdirSync(UUID, { recursive: true });
      }

      reuploadPrincipalGet(file, data);

      return res.send({ Inicio: solApr });
    }
  );
  // } else {
  //   return res.status(403).send({ ERROR: "Acceso solo para Admins" });
  // }
}

////////////////////////////////////////////////////
function reuploadPrincipalGet(file, data) {
  var bucket = process.env.BUCKET_REQUESTER;

  var path = data;
  var params = {
    Bucket: bucket,
    Key: path,
  };
  //console.log(params)

  sThree.getObject(params, (error, object) => {
    fs.writeFile("temp/" + file, object.Body, "binary", (err) => {
      if (err) console.log(err);

      const params2 = {
        Bucket: process.env.BUCKET,
        Key: path,
        Body: object.Body,
      };
      sThree.putObject(params2, (error, dataUpload) => {
        if (error) res.status(500).send({ error: "Error en la petición3" });
        if (!dataUpload) res.status(500).send({ error: "No se subio nada" });

        reuploadPrincipalDelete(file, path);
        return { 2: dataUpload.length };
      });
    });
  });
}

// function reuploadPrincipal(file, path, res) {
//   const bucket = process.env.BUCKET;

//   fs.readFile("temp/" + file, (error, data) => {
//     console.log(data)
//     var params = {
//       Bucket: bucket,
//       Key: path,
//       Body: data,
//     };

//     //console.log(data);
//   });
// }

function reuploadPrincipalDelete(file, path, res) {
  var bucket = process.env.BUCKET_REQUESTER;

  fs.unlink("temp/" + file, (error) => {
    if (error) {
      console.error(error);
    }

    const params = {
      Bucket: bucket,
      Key: path,
    };

    sThree.deleteObject(params, (error, dataDelete) => {
      if (error) res.status(500).send({ error: "Error en la petición3" });
      if (!dataDelete) res.status(500).send({ error: "No se subio nada" });

      return { conclusion: "funciona" };
    });
  });
}
/////

function denyRequest(req, res) {
  // const min = req.user;
  var folder = req.params.folder;
  var file = req.params.file;

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }
  var fecha = new Date();
  var bucket = process.env.BUCKET_REQUESTER;

  //   if (min.rol == "Admin") {

  const status = "Denegado";
  var params = {
    Bucket: bucket,
    Key: data,
  };

  request.findOneAndUpdate(
    { UUID: data },
    { estado: status, fechaEstado: fecha },
    { new: true },
    (error, solDen) => {
      if (error)
        return res.status(500).send({ mesaje: "Error de la petición3" });
      if (!solDen) return res.status(500).send({ mensaje: "Error al Denegar" });

      sThree.deleteObject(params, (error, dataDelete) => {
        if (error) res.status(500).send({ error: "Error en la petición3" });
        if (!dataDelete) res.status(500).send({ error: "No se subio nada" });

        return res.status(200).send({ Negacion: solDen });
      });
    }
  );
  //   } else {
  //     return res.status(403).send({ ERROR: "Acceso solo para Admins" });
  //   }
}
/////////////////////////////////////////////////////

function listRequests(req, res) {
  request.find(
    { estado: { $regex: "Pendiente", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ mensaje: "Error de la petición" });
      if (!allSo)
        return res
          .status(500)
          .send({ mensaje: "Error, no se encontraron request" });

      return res.status(200).send({ historialRequester: allSo });
    }
  );
}

function listApprove(req, res) {
  request.find(
    { estado: { $regex: "Aprobado", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ mensaje: "Error de la petición" });
      if (!allSo)
        return res
          .status(500)
          .send({ mensaje: "Error, no se encontraron request" });

      return res.status(200).send({ historialRequester: allSo });
    }
  );
}

function listDeny(req, res) {
  request.find(
    { estado: { $regex: "Denegado", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ mensaje: "Error de la petición" });
      if (!allSo)
        return res
          .status(500)
          .send({ mensaje: "Error, no se encontraron request" });

      return res.status(200).send({ historialRequester: allSo });
    }
  );
}

// Agregar una carpeta
function addFolder(req, res) {
  var min = req.user;

  if (min.rol != "Admin")
    return res.status(403).send({
      ERROR: "Solo los administradores pueden agregar un nuevo directorio",
    });

  const buck = process.env.BUCKET;
  const name = req.body.name + "/";
  var Objeto = { Bucket: buck, Key: name };

  temporal.putObject(Objeto, (error, fol) => {
    if (error) return res.send({ error: error });
    return res.send({ Folder: fol });
  });
}

// Descargar Datos
const dowloadData = (req, res) => {
  // var min = req.user;

  // if (min.rol != "Admin")
  //     return res.status(403).send({ ERROR: "Solo los administradores pueden descargar datos" });

  var folder = req.params.folder;
  var file = req.params.file;

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }

  // temporal.getObject({ Bucket: process.env.BUCKET, Key: data }, (err, file) => {
  //   console.log(file)
  //   if (err) return res.send({ err });
  //   res.download(file.Body);
  // });

  temporal.getObject(
    { Bucket: process.env.BUCKET_REQUESTER, Key: data },
    (error, fileend) => {
      console.log(fileend);
      fs.writeFile("descargas/" + file, fileend.Body, "binary", (err) => {
        if (err) return res.send({ err });
        if (!file) return res.send({ fileend });

        console.log(`./descargas/${file}`);

        res.download(`./descargas/${file}`);
      });
    }
  );
};

const deletee = (req, res) => {
  var file = req.params.file;
  console.log("llegamos");
  fs.unlink("descargas/" + file, (error) => {
    if (error) {
      console.error(error);
    }
  });
};

//Eliminar Datos
const deleteData = (req, res) => {
  var min = req.user;
  var folder = req.body.folder;
  var file = req.body.file;

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }

  if (min.rol != "Admin")
    return res
      .status(403)
      .send({ ERROR: "Solo los administradores pueden eliminar datos" });

  temporal.deleteObject(
    { Bucket: process.env.BUCKET, Key: data },
    (err, file) => {
      if (err) return res.send({ err });

      res.send("Documento Eliminado");
    }
  );
};

module.exports = {
  Admin,
  Login,
  Register,
  addAdmin,
  removeAdmin,
  denyRequest,
  approveRequest,
  reuploadPrincipalGet,
  reuploadPrincipalDelete,
  addFolder,
  dowloadData,
  deleteData,
  listRequests,
  listApprove,
  listDeny,
  deletee,
};
