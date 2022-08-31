require("dotenv").config()
const Amazon = require('aws-sdk')
const temporal = new Amazon.S3({ accessKeyId: process.env.ACCESS, secretAccessKey: process.env.SECRET })

function listData(req, res) {
    temporal.listObjectsV2({ Bucket: process.env.BUCKET }, (error, archivos) => {
        if (error) return res.send({ error: error })

        return res.send({ Data: archivos })
    });
}


function uploadData(req, res){
    res.send('Archivo subido exitosamente: ' + req.file.location)
}



module.exports = {
    listData,
    uploadData
}