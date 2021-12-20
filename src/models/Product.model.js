const {Schema, model} = require('mongoose');

const schema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number},
    amount: {type: Number},
    inStock: {type: Boolean},
    feedback: {
        type: [{ref: 'feedbacks', type: Schema.Types.ObjectId}]
    },
}, {
    autoIndex: process.env.NODE_ENV === 'development'
})

module.exports = model('products', schema);
