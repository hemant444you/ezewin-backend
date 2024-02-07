const mongoose = require('mongoose')
const { Schema, model } = require('mongoose')

const PaymentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    amount: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default:'Pending',
        required: true
    },
    razorpay_order_id: {
        type: String,
        required: true
    },
    receipt: {
        type: String,
        required: true
    },
    razorpay_payment_id: {
        type: String,
        required: false
    },
    razorpay_signature: {
        type: String,
        required: false
    },
    
},{timestamps: true},
 { toJSON: { virtuals: true }});


const Payment = model('Payment', PaymentSchema)
module.exports = Payment