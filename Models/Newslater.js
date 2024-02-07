const mongoose = require('mongoose')
const { Schema, model } = require('mongoose')

const NewslaterSchema = new Schema({

    email: {
        type: String,
        required: true
    },
    
}, {
    timestamps: true
})

const Newslater = model('Newslater', NewslaterSchema)
module.exports = Newslater