const mongoose = require('mongoose')
const { Schema, model } = require('mongoose')

const ContestSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    entry_fee: {
        type: String,
        required: true
    },
    max_members: {
        type: String,
        required: true
    },
    starts_at: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default:'Pending',
        required: true
    },
    rank: {
        type: String,
        required: false
    },
    hrTime: {
        type: Object,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
     winnings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Winning",
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    question:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
    }

    
},{timestamps: true},
 { toJSON: { virtuals: true }});

ContestSchema.virtual('winningsCount').get(function () {
    return this.winnings.length
});
ContestSchema.virtual('prizePoll').get(function () {
    return this.winnings.length ? this.winnings.map(p => p.amount).reduce((a, b) => Number(a) + Number(b)) : 0;
});
ContestSchema.virtual('wonAmount').get(function () {
    return this.quizzes.length ? this.quizzes.map(p => p.winning).reduce((a, b) => Number(a) + Number(b)) : 0;
});
ContestSchema.virtual('netProfit').get(function () {
    return this.collectedAmount - this.wonAmount;
});
ContestSchema.virtual('quizValue').get(function () {
    return this.entry_fee * this.max_members
});
ContestSchema.virtual('quizProfit').get(function () {
    return this.quizValue - this.prizePoll
});
ContestSchema.virtual('collectedAmount').get(function () {
    return this.joined_members * this.entry_fee
});
ContestSchema.virtual('joined_members').get(function () {
    return this.users.length
});
ContestSchema.virtual('remaining_members').get(function () {
    return this.max_members - this.quizzes.length
});

ContestSchema.virtual('quizOccuied').get(function () {
    return this.quizzes.length * 100 / this.max_members
});

ContestSchema.virtual('canJoin').get(function (req, res) {
    if(this.status == 'Upcoming'){
        return true;
    }else{
        return false;
    }
});

const Contest = model('Contest', ContestSchema)
module.exports = Contest