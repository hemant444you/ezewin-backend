const mongoose = require('mongoose')
const { Schema, model } = require('mongoose')

const NotificationSchema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    reciever: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        default:'Unread',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    
},{timestamps: true},
 { toJSON: { virtuals: true }});


const Notification = model('Notification', NotificationSchema)
module.exports = Notification