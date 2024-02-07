const mongoose = require('mongoose')
const { Schema, model } = require('mongoose');

const WinningSchema = new Schema({
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: [true, "Contest is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rank: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
}, {timestamps: true}, 
{ toJSON: { virtuals: true }});


const Winning = model('Winning', WinningSchema)
module.exports = Winning