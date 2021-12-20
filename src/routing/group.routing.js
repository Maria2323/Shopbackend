const {Router} = require('express');
const GroupModel = require('../models/Group.model');
const formParser = require(`connect-multiparty`);
const {validationResult} = require('express-validator');
const {body} = require("express-validator");
const fs = require('fs');
const path = require('path')
const ProductModel = require('../models/Product.model');
const {getNames} = require ('./../utils.js');
const {isAdmin} = require ('../middlewares');

const router = Router();
const multiparty = formParser();

const PATH_TO_FOLDER_FOR_IMAGES = './images/groups/'

router.post('/create', isAdmin, [
    body('name')
        .isString().withMessage('string expected')
        .custom(async (value) => {
            const checkName = await GroupModel.findOne({name: value});
            if (checkName) {
                throw new Error('Name is already exists')
            }
            return true;
        })
        .isLength({ min: 2, max: 64 }).withMessage('length between 2 and 64'),
    body('description')
        .isString().withMessage('string expected')
        .isLength({ min: 6, max: 164 }).withMessage('length between 6 and 164'),
    body('products')
        .isArray().withMessage('array expected')
], async (req, res) => {
    try {
        const {name, description, products} = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errors.array());
        }

        const idOfProducts = await ProductModel.find({id: [...products]});
        let productsId = idOfProducts.map(({id}) => id);
        console.log(productsId)

        const group = await new GroupModel({
            name,
            description,
            products: productsId
        });

        await group.save();

        return res.status(200).json({message: 'success'});

    } catch (e) {
        console.log(e)
        return res.status(500).json({message: 'server error'});
    }
});

router.get('/read/:id', async (req, res) => {
    try {
        const groupById = await GroupModel.findById(req.params.id).populate('products', 'name price');
        return res.status(200).json(groupById);
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.delete('/delete/:id', isAdmin, async (req, res) => {
    try {
        const groupById = await GroupModel.findOne({_id: req.params.id})
        await fs.access(PATH_TO_FOLDER_FOR_IMAGES + req.params.id, function(error) {
            if (error) {
                console.log("Папка не найден");
            } else {
                fs.rmdir(PATH_TO_FOLDER_FOR_IMAGES + req.params.id, {recursive: true}, function (err) {
                    if (err) {
                        throw new Error('Папка не может быть удалена')
                    }
                })
            }
        });
        await GroupModel.deleteOne({_id: req.params.id})
        res.send("удален товар:" + groupById)

    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.put('/editInfo/:id', isAdmin, [
    body('name')
        .isString().withMessage('string expected')
        .custom(async (value) => {
            const checkName = await GroupModel.findOne({name: value});
            if (checkName) {
                throw new Error('Name is already exists')
            }
            return true;
        })
        .isLength({ min: 2, max: 64 }).withMessage('length between 2 and 64'),
    body('description')
        .isString().withMessage('string expected')
        .isLength({ min: 6, max: 164 }).withMessage('length between 6 and 164'),
    body('products')
        .isArray().withMessage('array expected')
], async (req, res) => {
    try {
        const groupById = await GroupModel.findOne({_id: req.params.id})
        if (!groupById) {
            throw new Error('Товар с таким id  не найден')
        }
        if (req.body.name) {
            groupById.name = req.body.name
        }
        if (req.body.description) {
            groupById.description = req.body.description
        }
        if (req.body.products) {
            groupById.products = req.body.products
        }
        await groupById.save();
        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.put('/addPicture/:id', isAdmin, multiparty, async (req, res) => {
    try {
        const groupById = await GroupModel.findById(req.params.id)

        if (!groupById) {
            throw new Error('Товар с таким id  не найден')
        }

        const newNameForFolder = groupById.id + '/';

        try {
            await fs.statSync(PATH_TO_FOLDER_FOR_IMAGES + groupById.id);
        } catch (e) {
            await fs.mkdirSync(PATH_TO_FOLDER_FOR_IMAGES + groupById.id)
        }

        const arrayFromFiles = Object.values(req.files)
        const arr = await fs.readdirSync(PATH_TO_FOLDER_FOR_IMAGES + groupById.id)
        const existedNames = arr.map((value) => parseInt(path.basename(value, path.extname(value))));
        const newNames = getNames(existedNames, (arrayFromFiles.length + existedNames.length));

        for (let i = 0; i < arrayFromFiles.length; i++) {
            const file = await fs.readFileSync(arrayFromFiles[i].path)
            const newPath = PATH_TO_FOLDER_FOR_IMAGES + newNameForFolder + newNames[i] + path.extname(arrayFromFiles[i].path)
            await fs.writeFileSync(newPath, file)
        }

        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.put('/removePicture/:id', isAdmin, async (req, res) => {
    try {
        const groupById = await GroupModel.findById(req.params.id)
        const picturesFolder = PATH_TO_FOLDER_FOR_IMAGES + groupById.id;
        const pictures = await fs.readdirSync(picturesFolder);
        const picturesToRemove = req.body.pictures;
        const arrayToCheck = [];
        for (let i = 0; i < picturesToRemove.length; i++) {
            if (pictures.includes(picturesToRemove[i])) {
                arrayToCheck.push(i)
            }
        }
        for (let i = 0; i < picturesToRemove.length; i++) {
            try {
                if (arrayToCheck.length === picturesToRemove.length) {
                    await fs.unlinkSync(picturesFolder + '/' + picturesToRemove[i]);
                } else {
                    return res.status(404).json({message: ' Данных файлов не существует'});
                }
            } catch (e) {
                throw new Error(e);
            }
        }
        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

module.exports = router;
