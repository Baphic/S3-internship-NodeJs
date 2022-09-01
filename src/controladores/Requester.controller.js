require("dotenv").config();
const Amazon = require("aws-sdk");
const { S3 } = require("aws-sdk");
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

const s3Upload = async (files,user) => {
  const s3 = new S3();

  const params = files.map((file) => {
    console.log(user)
    let bucket;
    if(user.rol=='Requester'){
      bucket = process.env.BUCKET_REQUESTER;
    } else if( user.rol=='Admin'){
      bucket = process.env.BUCKET;
    }
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

//listar
function listData(req, res) {
  temporal.listObjectsV2({ Bucket: process.env.BUCKET }, (error, archivos) => {
    if (error) return res.send({ error: error });

    return res.send({ Data: archivos });
  });
}

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
    const results = await s3Upload(req.files,req.user);
    return res.json({ status: "success" });
  } catch (err) {
    console.log(err)
  }
};

module.exports = {
  listData,
  descargarData,
  elimarData,
  uploadData,
};
