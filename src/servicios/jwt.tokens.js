const jwt_simple = require('jwt-simple');
const moment = require('moment');
const secret = "clave_";

exports.crearToken = function (back) {
    let payload = {
        sub: back._id,
        usuario: back.usuario,
        rol: torneo.rol,
        iat: moment().unix(),
        exp: moment().day(7,'days').unix()
    }
    return jwt_simple.encode(payload, secret);
}