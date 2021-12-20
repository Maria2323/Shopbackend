const {Schema, model} = require('mongoose');

const schema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    products: {
        type: [{ref: 'products', type: Schema.Types.ObjectId}]
    },
}, {
    autoIndex: process.env.NODE_ENV === 'development'
})

module.exports = model('groups', schema);
