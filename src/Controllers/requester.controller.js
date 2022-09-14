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

const uuid = require("uuid").v4;

// Agregar Datos a S3
const uploadData = async (req, res) => {
  var des = req.body.descrip;
  var fol = req.body.folder;
  try {

    const results = await s3Upload(req.files, req.user, des, fol);

    return res.json({ status: "success" });
  } catch (err) {
    return res.status(500).send({ message: "Error en la peticion"});
  }
};

// Subir datos al bucket temporal
const s3Upload = async (files, user, des, fol) => {
  var s3 = new S3();

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

    const description = des;
    const _id = K;
    const name = file.originalname;

    requests(user.user, _id, name, description);

    return {
      Bucket: bucket,
      Key: K,
      Body: file.buffer,
    };
  });

  try {
    return await Promise.all(params.map((param) => s3.upload(param).promise()));
  } catch (err) {
    return res.status(500).send({message: "Error en la peticion"});
  }
};

// Request para subir los datos al directorio correspondiente
function requests(user, uuid, name, description, res) {
  var today = new Date();
  var requestModel = new request();

  requestModel.user = user;
  requestModel.date = today;
  requestModel.description = description;
  requestModel.name = name;
  requestModel.UUID = uuid;
  requestModel.status = "Pendiente";

  requestModel.save((error, savedRequest) => {
    if (error) return res.status(500).send({ message: "Error de la petición" });
    if (!savedRequest) return res.status(500).send({ message: "Error, no se puedo hacer la request para subir los archivos." });
  });
}

// Listar directorios
function listData(req, res) {
  var min = req.user;

  if (min.rol != "Requester")
  return res.status(403).send({message:'Solo el requester puede listar los directorios'});

  const paramss3 = {
    Bucket: process.env.BUCKET,
    Delimiter: '/'
  }

  temporal.listObjectsV2(paramss3, (error, data) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: data.CommonPrefixes });
  });
}

// Listar directorios temporales
const listDataTemporal = (req, res) => {
  const paramss3 = {
    Bucket: process.env.BUCKET_REQUESTER,
    Delimiter: '/'
  }

  temporal.listObjectsV2(paramss3, (error, data) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: data.CommonPrefixes });
  })
}

// Listar datos de directorios
const listDataDirectory = (req, res) => {
  var directory = req.params.directory;
  const paramss3 = {
    Bucket: process.env.BUCKET,
    StartAfter: directory + "/",
    Prefix: directory + "/"
  }
  temporal.listObjectsV2(paramss3, (error, data) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: data.Contents });
  })
}

// Listar datos de directorios temporales
const listDataDirectoryTemporal = (req, res) => {
  var parameters = req.body;
  const paramss3 = {
    Bucket: process.env.BUCKET_REQUESTER,
    StartAfter: parameters.directorio,
    Prefix: parameters.directorio
  }
  temporal.listObjectsV2(paramss3, (error, data) => {
    if (error) return res.send({ error: error });
    return res.send({ Data: data.Contents });
  })
}

module.exports = {
  listData,
  uploadData,
  listDataTemporal,
  listDataDirectory,
  listDataDirectoryTemporal
};