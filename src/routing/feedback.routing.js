const {Router} = require('express');
const FeedbackModel = require('../models/Feedback.model');
const ProductModel = require('../models/Product.model');
const {validationResult} = require('express-validator');
const {body} = require("express-validator");
const {isAuth} = require("../middlewares");

const router = Router();

router.post('/create', isAuth, [
    body('userId')
        .isString().withMessage('string expected')
        .isLength({ min: 2, max: 50 }).withMessage('length between 2 and 50'),
    body('feedbackText')
        .isString().withMessage('string expected')
        .isLength({ min: 2, max: 300 }).withMessage('length between 2 and 300'),
    body('rating')
        .isNumeric().withMessage('number expected')
        .trim(),
    body('productId')
        .isString().withMessage('string expected')
        .trim()
], async (req, res) => {
    try {
        const {feedbackText, rating, productId} = req.body;
        const userId = req.user;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errors.array());
        }

        const feedback = await new FeedbackModel({
            userId,
            feedbackText,
            rating,
            productId
        });
        await feedback.save();

        const product = await ProductModel.findById(productId)
        product.feedback.push(feedback)
        product.save();

        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
});

router.get('/read/:id', async (req, res) => {
    try {
        const feedbackById = await FeedbackModel.findOne({_id: req.params.id})
        res.send(feedbackById)
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.delete('/delete/:id', isAuth, async (req, res) => {
    try {
        const feedbackById = await FeedbackModel.findOne({_id: req.params.id})
        if (req.user.id === feedbackById.userId.toString()) {
            await FeedbackModel.deleteOne(feedbackById)
        } else {
            return res.status(403).json({message: 'У Вас нет доступа'});
        }
        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

router.put('/edit/:id', isAuth, [
    body('userId')
        .isString().withMessage('string expected')
        .isLength({ min: 2, max: 20 }).withMessage('length between 2 and 20'),
    body('feedbackText')
        .isString().withMessage('string expected')
        .isLength({ min: 2, max: 300 }).withMessage('length between 2 and 300'),
    body('rating')
        .isNumeric().withMessage('number expected')
        .trim()
], async (req, res) => {
    try {
        const feedbackById = await FeedbackModel.findOne({_id: req.params.id})
        if (!feedbackById) {
            throw new Error('Товар с таким id  не найден')
        }
        if (req.user.id === feedbackById.userId.toString()) {
            if (req.body.userName) {
                feedbackById.userName = req.body.userName
            }
            if (req.body.feedbackText) {
                feedbackById.feedbackText = req.body.feedbackText
            }
            if (req.body.rating) {
                feedbackById.rating = req.body.rating
            }
            await feedbackById.save();
        } else {
            return res.status(403).json({message: 'У Вас нет доступа'});
        }
        return res.status(200).json({message: 'success'});
    } catch (e) {
        return res.status(500).json({message: 'server error'});
    }
})

module.exports = router;
