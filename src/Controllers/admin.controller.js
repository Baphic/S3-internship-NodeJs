require("dotenv").config();
const user = require("../Models/users.model");
const request = require("../Models/requets.model");
const bcrypt = require("bcrypt-nodejs");
const jwt = require("../Services/jwt.tokens");
const fs = require("fs");
const Amazon = require("aws-sdk");


const temporal = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
});
const sThree = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
  apiVersion:'2006-03-01',
  signatureVersion: 'v4'
});

// Creacion de Admin default
function Admin(res) {
  var adminModel = new user();
  adminModel.name = "Back";
  adminModel.surname = "End";
  adminModel.user = "ADMIN";
  adminModel.rol = "Admin";

  user.find({ rol: adminModel.rol }, (error, findAdmin) => {
    if (error)
      return res.status(500).send({ message: "Error de la petición1" });
    if (findAdmin.length == 0)
      bcrypt.hash("ADMIN", null, null, (error, passwordEncript) => {
        if (error)
          return res.status(500).send({ message: "Error de la petición2" });
        adminModel.password = passwordEncript;

        adminModel.save((error, adminSave) => {
          if (error)
            return res.status(500).send({ message: "Error de la petición3" });
          if (!adminSave)
            return res.status(500).send({ message: "Error, no se creó ningún Admin" });
        });
      });
  });
}

// Login
function Login(req, res) {
  var parameters = req.body;

  if ((parameters.user || parameters.email) && parameters.password) {
    if (parameters.user) {
      user.findOne(
        { user: parameters.user },
        (error, userFound) => {
          if (error)
            return res.status(500).send({ message: "Error en la petición1" });
          if (userFound) {
            bcrypt.compare(
              parameters.password,
              userFound.password,
              (error, verificationPassword) => {
                if (error)
                  return res.status(500).send({ mensaje: "Error en la petición2" });
                if (verificationPassword) {
                  if (parameters.Token === "true") {
                    return res.status(200).send({
                      token: jwt.crearToken(userFound),
                      infoUser: userFound,
                    });
                  }
                } else {
                  userFound.password = undefined;
                  return res.status(401).send({ message: "Contraseña y/o user incorrecto" });
                }
              }
            );
          } else {
            return res.status(500).send({ message: "Error, este user no se encuentra registrado" });
          }
        }
      );
    } else if (parameters.email) {
      user.findOne(
        { email: parameters.email },
        (error, userFound) => {
          if (error)
            return res.status(500).send({ message: "Error en la petición" });
          if (userFound) {
            bcrypt.compare(
              parameters.password,
              userFound.password,
              (error, verificationPassword) => {
                if (verificationPassword) {
                  if (parameters.Token === "true") {
                    return res.status(200).send({ token: jwt.crearToken(userFound) });
                  }
                } else {
                  userFound.password = undefined;
                  return res.status(401).send({ message: "Contraseña y/o email incorrecto" });
                }
              }
            );
          } else {
            return res.status(500).send({message: "Error, este correo no se encuentra registrado"});
          }
        }
      );
    }
  }
}

// Registro
function Register(req, res) {
  var parameters = req.body;
  var userModel = new user();

  if (
    parameters.name &&
    parameters.surname &&
    parameters.user &&
    parameters.email &&
    parameters.password &&
    parameters.rol
  ) {
    userModel.name = parameters.name;
    userModel.surname = parameters.surname;
    userModel.email = parameters.email;
    userModel.user = parameters.user;
    userModel.rol = parameters.rol;

    user.find(
      { user: parameters.user },
      (error, userFound) => {
        if (error)
          return res.status(500).send({ message: "Error de la petición1" });
        if (userFound.length == 0) {
          user.find(
            { email: parameters.email },
            (error, userFound2) => {
              if (error)
                return res.status(500).send({ message: "Error de la petición2" });
              if (userFound2.length == 0) {
                bcrypt.hash(
                  parameters.password,
                  null,
                  null,
                  (error, encryptedPassword) => {
                    if (error)
                      return res.status(500).send({ message: "Error de la petición3" });
                    userModel.password = encryptedPassword;

                    userModel.save((error, userSaved) => {
                      if (error)
                        return res.status(500).send({ message: "Error de la petición4" });
                      if (!userSaved)
                        return res.status(500).send({message: "Error, no se registro correctamente"});
                        return res.status(200).send({ user: userSaved });
                    });
                  }
                );
              } else {
                return res.status(500).send({ message: "Este Correo ya se encuentra registrado" });
              }
            }
          );
        } else {
          return res.status(500).send({ message: "Este user ya se encuentra en uso" });
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
      if (error) res.status(500).send({ message: "error en la petición1" });
      if (!reqEnc) res.status(500).send({ message: "No existe este Requester" });

      if (reqEnc.rol == "Admin")
        return res.status(500).send({ requester: "Este user ya es rol Admin" });

      user.findByIdAndUpdate(
        idReq,
        { rol: role },
        { new: true },
        (error, reqUpd) => {
          if (error)
            return res.status(500).send({ message: "Error de la petición2" });
            
          if (!reqUpd)
            return res.status(500).send({ message: "Error al registrar" });

          return res.status(200).send({ Admin: reqUpd });
        }
      );
    });
  } else {
    return res.status(403).send({ message: "Acceso solo para Admins" });
  }
}

function removeAdmin(req, res) {
  var idAdm = req.params.idAdm;
  const role = "Requester";
  var run = req.user.rol;

  if (run == "Admin") {
    user.findById(idAdm, (error, uEn) => {
      if (error) res.status(500).send({ message: "error en la petición" });
      if (!uEn) res.status(500).send({ message: "No existe este Admin" });

      if (uEn.rol == "Requester")
        return res.status(500).send({ requester: "Este user ya es rol Requester" });

      user.findByIdAndUpdate(
        idAdm,
        { rol: role },
        { new: true },
        (error, admUpd) => {
          if (error)
            return res.status(500).send({ message: "Error de la petición2" });

          if (!admUpd)
            return res.status(500).send({ message: "Error al degradar" });

          return res.status(200).send({ requester: admUpd });
        }
      );
    });
  } else {
    return res.status(403).send({ message: "Acceso solo para Admins" });
  }
}

// Aprobar solicitudes
function approveRequest(req, res) {
  var folder = req.params.folder;
  var file = req.params.file;
  var date = new Date();

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }

  const status = "Aprobado";
  const UUID = data;

  request.findOneAndUpdate(
    { UUID: UUID },
    { status: status, dateStatus: date },
    { new: true },
    (error, solApr) => {
      if (error)
        return res.status(500).send({ message: "Error de la petición3" });

      if (!solApr) return res.status(500).send({ message: "Error al Aceptar" });

      if (UUID.includes("/") == true) {
        fs.mkdirSync("/" + UUID, { recursive: true });
      } else if (UUID.includes == false) {
        fs.mkdirSync(UUID, { recursive: true });
      }

      let name;
      if (folder != null) {
        name = folder + "/" + solApr.name;
      } else if (folder == null) {
        name = solApr.name;
      }

      reuploadPrincipalGet(file, data, name);

      return res.status(200).send({ result: solApr });
    }
  );
}

// Proceso despues de la aprobacion
function reuploadPrincipalGet(file, data, name) {
  var bucket = process.env.BUCKET_REQUESTER;

  var path = data;
  var params = {
    Bucket: bucket,
    Key: path,
  };

  sThree.getObject(params, (error, object) => {
    const params2 = {
      Bucket: process.env.BUCKET,
      Key: name,
      Body: object.Body,
    };
    sThree.putObject(params2, (error, dataUpload) => {
      if (error) res.status(500).send({ message: "Error en la petición" });
      if (!dataUpload) res.status(500).send({ message: "No se subio nada" });

      reuploadPrincipalDelete(file, path);
      return { 2: dataUpload.length };
    });
  });
}

// Proceso despues de la denegacion
function reuploadPrincipalDelete(file, path, res) {
  var bucket = process.env.BUCKET_REQUESTER;

  const params = {
    Bucket: bucket,
    Key: path,
  };

  sThree.deleteObject(params, (error, dataDelete) => {
    if (error) res.status(500).send({ message: "Error en la petición3" });
    if (!dataDelete) res.status(500).send({ message: "No se subio nada" });

    return res.status(200).send({ message: "Funcionamiento exitoso" });
  });
}

// Denegar solicitudes
function denyRequest(req, res) {
  var folder = req.params.folder;
  var file = req.params.file;

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }
  var date = new Date();
  var bucket = process.env.BUCKET_REQUESTER;

  const status = "Denegado";
  var params = {
    Bucket: bucket,
    Key: data,
  };

  request.findOneAndUpdate(
    { UUID: data },
    { status: status, dateStatus: date },
    { new: true },
    (error, solDen) => {
      if (error)
        return res.status(500).send({ message: "Error de la petición" });

      if (!solDen) return res.status(500).send({ message: "Error al Denegar" });

      sThree.deleteObject(params, (error, dataDelete) => {
        if (error) res.status(500).send({ message: "Error en la petición" });
        if (!dataDelete) res.status(500).send({ message: "No se subio nada" });

        return res.status(200).send({ denial: solDen });
      });
    }
  );
}

// Listar solicitudes
function listRequests(req, res) {
  request.find(
    { status: { $regex: "Pendiente", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ message: "Error de la petición" });

      if (!allSo)
        return res.status(500).send({ message: "Error, no se encontraron request" });

      return res.status(200).send({ requests: allSo });
    }
  );
}

// Listar solicitudes aprobadas
function listApprovedRequests(req, res) {
  request.find(
    { status: { $regex: "Aprobado", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ message: "Error de la petición" });

      if (!allSo)
        return res.status(500).send({ message: "Error, no se encontraron request" });

      return res.status(200).send({ requests: allSo });
    }
  );
}

// Listar solicitudes denegadas
function listDeniedRequests(req, res) {
  request.find(
    { status: { $regex: "Denegado", $options: "i" } },
    (error, allSo) => {
      if (error)
        return res.status(500).send({ message: "Error de la petición" });

      if (!allSo)
        return res.status(500).send({ message: "Error, no se encontraron request" });

      return res.status(200).send({ requests: allSo });
    }
  );
}

// Agregar una carpeta
function addFolder(req, res) {
  var min = req.user;

  if (min.rol != "Admin")
    return res.status(403).send({ message: "Solo los administradores pueden agregar un nuevo directorio" });

  const buck = process.env.BUCKET;
  const name = req.body.name + "/";
  var Object = { Bucket: buck, Key: name };

  temporal.putObject(Object, (error, fol) => {
    if (error) return res.status(500).send({ message: error });
    return res.status(200).send({ message: "Directorio creado correctamente" });
  });
}

// Descargar Datos
const downloadData = (req, res) => {

  var folder = req.params.folder;
  var file = req.params.file;

  let data;
  if (folder != null) {
    data = folder + "/" + file;
  } else if (folder == null) {
    data = file;
  }

  temporal.getObject(
    { Bucket: process.env.BUCKET_REQUESTER, Key: data }, (error, fileend) => {
      if (error) { return res.status(500).send({ message: error }); }
      const params = {
        Bucket: process.env.BUCKET_REQUESTER,
        Key: data,
        Expires: 3600
      }

      sThree.getSignedUrl("getObject", params, (error, download) => {
        if (error) { return res.status(500).send({ message: error }); }

        return res.status(200).send({ message: download });
      })
    });
};

const deletee = (req, res) => {
  var file = req.params.file;
  fs.unlink("descargas/" + file, (error) => {
    if (error) {
      return res.status(500).send({ message: error });
    }
  });
};

// Eliminar Datos
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
    return res.status(403).send({ message: "Solo los administradores pueden eliminar datos" });

  temporal.deleteObject(
    { Bucket: process.env.BUCKET, Key: data },
    (err, file) => {
      if (err) return res.status(500).send({ message: "Ocurrio un error al intentar eliminar" });

      return res.status(200).send({ message:"Eliminado correctamente" });
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
  downloadData,
  deleteData,
  listRequests,
  listApprovedRequests,
  listDeniedRequests,
  deletee,
};
