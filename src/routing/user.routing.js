const {Router} = require('express');
const UserModel = require('../models/User.model');
const {validationResult} = require('express-validator');
const {body} = require("express-validator");
const router = Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {secret} = require("../config");
const {isAdmin, isAuth} = require ('../middlewares');

const generateAccessToken = (data) => {
    return jwt.sign(data, secret, {expiresIn: "24h"});
}

router.post('/create', [
    body('email')
        .isString().withMessage('string expected')
        .isEmail().withMessage('email expected')
        .custom(async (value) => {
            const checkEmail = await UserModel.findOne({email: value});
            if (checkEmail) {
                throw new Error('Email is already exists')
            }
            return true;
        })
        .isLength({ min: 3, max: 64 }).withMessage('length between 3 and 64')
        .trim(),
    body('name')
        .isString().withMessage('string expected')
        .custom(async (value) => {
            const checkName = await UserModel.findOne({name: value});
            if (checkName) {
                throw new Error('Name is already exists')
            }
            return true;
        })
        .isLength({ min: 2, max: 30 }).withMessage('length between 2 and 30')
        .trim(),
    body('password')
        .isString().withMessage('string expected')
        .isLength({ min: 6, max: 64 }).withMessage('length between 6 and 64')
        .trim(),
    body('repeatPassword')
        .isString().withMessage('string expected')
        .custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Password is not the same')
            }
            return true;
        })
], async (req, res) => {
    try {
        const {email, password, name} = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json(errors.array());
        }
        const hashPassword = bcrypt.hashSync(password, 7)
        const user = await new UserModel({
            email,
            password: hashPassword,
            name
        });
        await user.save();
        return res.status(200).json({message: 'success'});

    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
});

router.get('/get/:id', isAuth, async (req, res) => {
    try {
        const userById = await UserModel.findOne({_id: req.params.id});
        res.send(userById);
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.delete('/delete/:id', isAuth, async (req, res) => {
    try {
        const userById = await UserModel.findOne({_id: req.params.id})
        if (req.user.id === userById.id.toString() || req.user.accessLevel === "admin") {
            await UserModel.deleteOne({_id: req.params.id})
        } else {
            return res.status(403).json({message: 'У Вас нет доступа'});
        }
        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body
        const candidate = await UserModel.findOne({email})
        if (!candidate) {
            return res.status(403).json({message: "Пользователь не найден или пароль не верен"})
        }
        const validPassword = bcrypt.compareSync(password, candidate.password);
        if (!validPassword) {
            return res.status(403).json({message: "Пользователь не найден или пароль не верен"})
        }
        const token = generateAccessToken({id: candidate._id, accessLevel: candidate.accessLevel})
        return res.status(200).json({token: token});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

module.exports = router;
