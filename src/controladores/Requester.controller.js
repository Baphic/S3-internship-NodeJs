require("dotenv").config();
const Amazon = require("aws-sdk");
const { S3 } = require("aws-sdk");

const Historial = require("../modelos/registros.model");

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

    let descripcion = des;
    let _id = (uuid() + file.originalname);
    let name = file.originalname;

    historial(name, _id, user.usuario, descripcion);

    return {
      Bucket: bucket,
      Key: `${uuid()}-${file.originalname}`,
      Body: file.buffer,
    };
  });

  try {
    return await Promise.all(params.map((param) => s3.upload(param).promise()));
  } catch (err) {
    console.log(err);
  }
};

// listar
function listData(req, res) {
  temporal.listObjectsV2({ Bucket: process.env.BUCKET }, (error, archivos) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: archivos });
  });
}

// actualizar historial

function historial(name, uuid, user, descripcion, res) {
  var hoy = new Date();
  var uaio = user;
  var newRegistro = new Historial();

  console.log(uaio + "USUARIO")
  console.log(descripcion + "DESCRIP")
  newRegistro.usuario = uaio;
  newRegistro.fecha = hoy;
  newRegistro.descripcion = descripcion;
  newRegistro.nombre = name;
  newRegistro.UUID = uuid;

  console.log(newRegistro.UUID)
  newRegistro.save((error, registroGuardado) => {
    if (error) return res.status(500).send({ mensaje: "Error de la petición" });
    if (!registroGuardado) return res.status(500).send({ mensaje: "Error, no se agrego el registro" });

  });
}

// agregar carpeta
function addCarpeta(req, res) {
  const buck = req.body.bucket;
  const name = req.body.name + "/";
  var Objeto = { Bucket: buck, Key: name };

  temporal.putObject(Objeto, (error, fol) => {
    if (error) return res.send({ error: error })
    return res.send({ Folder: fol })
  })
}

/*function listCarpetas(req, res) {
  const buck = req.body.bucket;
}*/

////////////////////////////////////////////////


//Descargar
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

//Eliminar
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

//Agregar
const uploadData = async (req, res) => {
  try {
    console.log(req.user)
    console.log(req.body.descrip)
    const results = await s3Upload(req.files, req.user, req.body.descrip);

    return res.json({ status: "success" });
  } catch (err) {
    console.log(err)
  }
};

module.exports = {
  listData,
  historial,
  descargarData,
  elimarData,
  uploadData,
  //listCarpetas,
  addCarpeta
};
