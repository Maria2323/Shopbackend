const {Schema, model} = require('mongoose');

const schema = new Schema({
    email: {type: String, required: true},
    name: {type: String, required: true},
    password: {type: String, required: true},
    accessLevel: {type: String, default: 'user'},
}, {
    autoIndex: process.env.NODE_ENV === 'development'
})

module.exports = model('users', schema);
