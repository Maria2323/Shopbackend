const jwt = require('jsonwebtoken');
const {secret} = require("./config");

module.exports = {
    isAuth: (req, res, next) => {
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                return res.status(401).json({message: "Пользователь не авторизован"})
            }
            const decodedData = jwt.verify(token, secret)
            req.user = decodedData;
            next()
        } catch (e) {
            return res.status(401).json({message: "Пользователь не авторизован"})
        }
    },

    isAdmin: (req, res, next) => {
        if (req.method === "OPTIONS") {
            next();
        }
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return res.status(401).json({message: "Пользователь не авторизован"});
            }
            const decodedData = jwt.verify(token, secret);
            if (decodedData.accessLevel !== "admin") {
                return res.status(403).json({message: "У вас нет доступа"});
            }
            next();
        } catch (e) {
            return res.status(401).json({message: "Пользователь не авторизован"});
        }
    }
}


