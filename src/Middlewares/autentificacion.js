const jwt_simple = require('jwt-simple');
const moment = require('moment');
const secret = 'clave_'

exports.Auth = function(req, res, next) {
    if( !req.headers.authorization ){
        return res.status(404).send({ mensaje: "No se encontró la cabecera Autentificacion" });
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        var payload = jwt_simple.decode(token, secret);
        if( moment().unix() > payload.exp ){
            return res.status(404).send({ mensaje: "El token ya ha expirado" })
        }
    } catch (error) {
        return res.status(500).send({ mensaje: "El token no es válido"})
    }

    req.user = payload;
    next();

}
