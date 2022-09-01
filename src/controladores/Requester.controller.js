require("dotenv").config()
const Amazon = require('aws-sdk');
const temporal = new Amazon.S3({ accessKeyId: process.env.ACCESS, secretAccessKey: process.env.SECRET, region: process.env.REGION })

////////////////////////////////////////////////

function listData(req, res) {
    const buck = req.body.bucket;
    temporal.listObjectsV2({ Bucket: buck, Key: "/" }, (error, archivos) => {
        if (error) return res.send({ error: error })

        return res.send({ Data: archivos })
    });
}

function addCarpeta(req, res) {
    const buck = req.body.bucket;
    const name = req.body.name + "/";
    var Objeto = { Bucket: buck, Key: name };

    temporal.putObject(Objeto, (error, fol) => {
        if (error) return res.send({ error: error })
        return res.send({ Folder: fol })
    })
}

function listCarpetas(req, res) {
    const buck = req.body.bucket;


}

////////////////////////////////////////////////

//Descargar
const descargarData = (req, res) => {
    const fileName = req.params.fileName;
    temporal.getObject({ Bucket: process.env.BUCKET, Key: fileName }, (err, file) => {
        if (err) return res.send({ err });

        res.send(file.Body);
    })
};

//Eliminar
const elimarData = (req, res) => {
    const fileName = req.params.fileName;
    temporal.deleteObject({ Bucket: process.env.BUCKET, Key: fileName }, (err, file) => {
        if (err) return res.send({ err });

        res.send("Documento Eliminado")
    })
}

function uploadData(req, res) {
    res.send('Archivo subido exitosamente: ' + req.file.location)
}



module.exports = {
    listData,
    listCarpetas,
    addCarpeta,
    descargarData,
    elimarData,
    uploadData
}