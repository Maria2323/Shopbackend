const {Schema, model} = require('mongoose');

const schema = new Schema({
    userId: {ref: 'users', type: Schema.Types.ObjectId},
    feedbackText: {type: String, required: true},
    rating: {type: Number},
    productId: {ref: 'products', type: Schema.Types.ObjectId}
}, {
    autoIndex: process.env.NODE_ENV === 'development'
})

module.exports = model('feedbacks', schema);
