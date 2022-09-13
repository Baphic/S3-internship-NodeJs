require("dotenv").config();
const Amazon = require("aws-sdk");
const { S3 } = require("aws-sdk");

const request = require("../Models/requets.model");

Amazon.config.update({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
  region: process.env.REGION,
});

const temporal = new Amazon.S3({
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.SECRET,
});

const { S3Client, PutObjectCommand, ConditionFilterSensitiveLog } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const uuid = require("uuid").v4;


// Agregar Datos a S3
const uploadData = async (req, res) => {
  var des = req.body.descrip;
  var fol = req.body.folder;
  try {
    //console.log(req.user)
    //console.log(des)

    const results = await s3Upload(req.files, req.user, des, fol);

    return res.json({ status: "success" });
  } catch (err) {
    console.log(err)
  }
};


// Subir datos al bucket temporal
const s3Upload = async (files, user, des, fol) => {
  var s3 = new S3();

  console.log(files)

  const params = files.map((file) => {

    const ext = file.originalname.split(".").pop();

    let bucket;
    if (user.rol == 'Requester') {
      bucket = process.env.BUCKET_REQUESTER;
    } else if (user.rol == 'Admin') {
      bucket = process.env.BUCKET;
    }

    let K;
    if (fol != null) {
      K = `${fol + uuid()+'.'+ext}`
    } else if (fol == null) {
      K = `${uuid()}`
    }

    const descripcion = des;
    const _id = K;
    const name = file.originalname;

    requests(user.usuario, _id, name, descripcion);

    return {
      Bucket: bucket,
      Key: K,
      Body: file.buffer,
    };
  });

  try {
    console.log(params)
    return await Promise.all(params.map((param) => s3.upload(param).promise()));
  } catch (err) {
    console.log(err);
  }
};


// request para subir los datos al directorio correspondiente
function requests(user, uuid, name, descripcion, res) {
  var hoy = new Date();
  var request = new request();

  request.usuario = user;
  request.fecha = hoy;
  request.descripcion = descripcion;
  request.nombre = name;
  request.UUID = uuid;
  request.estado = "Pendiente";

  request.save((error, requestGuardada) => {
    if (error) return res.status(500).send({ mensaje: "Error de la petición" });
    if (!requestGuardada) return res.status(500).send({ mensaje: "Error, no se puedo hacer la request para subir los archivos." });
  });
}

// Actualizar el historial (Pendiente)
function record(user, razon, name, uuid, res) {
  var hoy = new Date();
  var uaio = user;
  var newRegistro = new request();
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

// Listar Datos
function listData(req, res) {
  var min = req.user;

  if (min.rol != "Requester")
  return res.status(403).send({mensaje:'Solo el requester puede listar los directorios'})

  const paramss3 = {
    Bucket: process.env.BUCKET,
    Delimiter: '/'
  }

  temporal.listObjectsV2(paramss3, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos.CommonPrefixes });
  });
}

const listDataTemporal = (req, res) => {
  const paramss3 = {
    Bucket: process.env.BUCKET_REQUESTER,
    Delimiter: '/'
  }

  temporal.listObjectsV2(paramss3, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos.CommonPrefixes });
  })
}

const listDataDirectorio = (req, res) => {
  //let parametros = req.body;
  var directorio = req.params.directorio;
  const paramss3 = {
    Bucket: process.env.BUCKET,
    StartAfter: directorio + "/",
    Prefix: directorio + "/"
  }
  temporal.listObjectsV2(paramss3, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos.Contents });
  })
}

const listDataDirectorioTemporal = (req, res) => {
  var parametros = req.body;
  const paramss3 = {
    Bucket: process.env.BUCKET_REQUESTER,
    StartAfter: parametros.directorio,
    Prefix: parametros.directorio
  }
  temporal.listObjectsV2(paramss3, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos.Contents });
  })
}

module.exports = {
  listData,
  record,
  uploadData,
  listDataTemporal,
  listDataDirectorio,
  listDataDirectorioTemporal
};