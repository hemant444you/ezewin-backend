const { Schema, model } = require('mongoose');

const QuestionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    option_A: {
        type: String,
        required: true
    },
    option_B: {
        type: String,
        required: true
    },
    option_C: {
        type: String,
        required: true
    },
    option_D: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    video: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'Unused'
    },
}, {
    timestamps: true
});


QuestionSchema.virtual("video_path").get(function () {
  return `https://ezewin.s3.ap-south-1.amazonaws.com/${this.video} `;
});

const Question = model('Question', QuestionSchema)
module.exports = Question