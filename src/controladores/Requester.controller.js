require("dotenv").config();
const Amazon = require("aws-sdk");
const { S3 } = require("aws-sdk");

const Solicitud = require("../modelos/solicitudes.model");

Amazon.config.update({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
  region: process.env.REGION,
});

const temporal = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
});

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const uuid = require("uuid").v4;

// Agregar Datos a S3
const uploadData = async (req, res) => {
  let des = req.body.descrip
  try {
    console.log(req.user)
    console.log(des)

    const results = await s3Upload(req.files, req.user, des);

    return res.json({ status: "success" });
  } catch (err) {
    console.log(err)
  }
};


// Subir datos al bucket temporal
const s3Upload = async (files, user, des) => {
  const s3 = new S3();

  const params = files.map((file) => {
    //console.log(user)
    //console.log("logeado")

    let bucket;
    if (user.rol == 'Requester') {
      bucket = process.env.BUCKET_REQUESTER;
    } else if (user.rol == 'Admin') {
      bucket = process.env.BUCKET;
    }

    const K = `${uuid()}`

    let razon = des;
    let _id = K;
    let name = file.originalname;

    solicitud(user.usuario, razon, name, _id);

    return {
      Bucket: bucket,
      Key: K,
      Body: file.buffer,
    };
  });

  try {
    return await Promise.all(params.map((param) => s3.upload(param).promise()));
  } catch (err) {
    console.log(err);
  }
};


// Solicitud para subir los datos al directorio correspondiente
function solicitud(user, uuid, name, descripcion, res) {
  var hoy = new Date();
  var solicitud = new Solicitud();

  solicitud.usuario = user;
  solicitud.fecha = hoy;
  solicitud.descripcion = descripcion;
  solicitud.nombre = name;
  solicitud.UUID = uuid;
  solicitud.estado = "Pendiente";

  solicitud.save((error, solicitudGuardada) => {
    if (error) return res.status(500).send({ mensaje: "Error de la petición" });
    if (!solicitudGuardada) return res.status(500).send({ mensaje: "Error, no se puedo hacer la solicitud para subir los archivos." });
  });
}


// Actualizar el historial (Pendiente)
function historial(user, razon, name, uuid, res) {
  var hoy = new Date();
  var uaio = user;
  var newRegistro = new Solicitud();
  /*
  console.log(uaio + "USUARIO")
  console.log(descripcion + "DESCRIP")
  */
  newRegistro.usuario = uaio;
  newRegistro.fecha = hoy;
  newRegistro.descripcion = razon;
  newRegistro.nombre = name;
  newRegistro.UUID = uuid;
  newRegistro.estado = "Pendiente";

  console.log(newRegistro.UUID)
  newRegistro.save((error, registroGuardado) => {
    if (error) return res.status(500).send({ mensaje: "Error de la petición" });
    if (!registroGuardado) return res.status(500).send({ mensaje: "Error, no se agrego el registro" });

  });
}


// Agregar una carpeta
function addCarpeta(req, res) {
  const buck = req.body.bucket;
  const name = req.body.name + "/";
  var Objeto = { Bucket: buck, Key: name };

  temporal.putObject(Objeto, (error, fol) => {
    if (error) return res.send({ error: error })
    return res.send({ Folder: fol })
  })
}


// Listar Datos
function listData(req, res) {

  const min = req.user;

  if (min.rol != "Requester")
  return res.status(500).send({mensaje:'Solo el requester puede listar los directorios'})

  temporal.listObjectsV2({ Bucket: process.env.BUCKET }, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos });
  });
}


// Descargar Datos
const descargarData = (req, res) => {
  const fileName = req.params.fileName;
  temporal.getObject(
    { Bucket: process.env.BUCKET, Key: fileName },
    (err, file) => {
      if (err) return res.send({ err });

      res.send(file.Body);
    }
  );
};


//Eliminar Datos
const elimarData = (req, res) => {
  const fileName = req.params.fileName;
  temporal.deleteObject(
    { Bucket: process.env.BUCKET, Key: fileName },
    (err, file) => {
      if (err) return res.send({ err });


      res.send("Documento Eliminado");
    }
  );
};


module.exports = {
  listData,
  historial,
  descargarData,
  elimarData,
  uploadData,
  addCarpeta
};
