const mongoose = require('mongoose')
const { Schema, model } = require('mongoose')

const QuizSchema = new Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: [true, "Contest is required"],
    },
    answered_option: {
        type: String,
    },
    answered_in: {
        type: String,
    },
    rank: {
        type: String,
    },
    winning: {
        type: String,
    },
    
}, {
    timestamps: true
});

const Quiz = model('Quiz', QuizSchema)
module.exports = Quiz