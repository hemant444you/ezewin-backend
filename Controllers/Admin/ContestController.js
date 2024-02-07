const Contest = require("../../Models/Contest.js");
const Winning = require("../../Models/Winning.js");
const User = require("../../Models/userModel.js");
const Setting = require("../../Models/Setting.js");
const Quiz = require("../../Models/Quiz.js");
const Question = require("../../Models/Question.js");
const admin = require("firebase-admin");
var serviceAccount = require('../../fcm2.json');

module.exports = {
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const contests = await Contest.find();
		res.render('admin/contest/index',{contests,setting});
	},

	show : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const contest = await Contest.findById(req.params.id).populate('winnings').populate('users').populate('question').populate('quizzes');
		var quizzes = '';
	    if(contest.status == 'Completed'){
		    quizzes = await Quiz.find({contest:req.params.id}).populate('user');
		}
		const quizCount = await Quiz.find({contest:req.params.id}).countDocuments();
		res.render('admin/contest/show',{contest,setting,quizzes,quizCount});	
	},

	store : async (req, res) => {
		const {name,entry_fee,max_members,starts_at} = req.body;
		const contest = new Contest({
			name:name,
			entry_fee:entry_fee,
			max_members:max_members,
			starts_at:starts_at,
		});
		const result = await contest.save();
		req.session.sessionFlash = {
			type: 'success',
			message: 'Contest Added successfully !'
		}
		res.redirect('/admin/contest');
	},

	update : async (req, res) => {
		const {name,entry_fee,max_members,starts_at} = req.body;
		const result = await Contest.findByIdAndUpdate(req.body.id,{
			name:name,
			entry_fee:entry_fee,
			max_members:max_members,
			starts_at:starts_at,
		});

		req.session.sessionFlash = {
			type: 'success',
			message: 'Contest updated successfully !'
		}
		res.redirect('/admin/contest');
	},

	delete : async (req, res) => {
		const contest = await Contest.findByIdAndDelete(req.body.id);
		res.send('Contest Deleted');
	},

	store_winning : async (req, res) => {
		const contest_id = req.body.contest;
		const {rank,amount} = req.body;
		var winning = new Winning();
		if(req.body.id){
			winning = await Winning.findById(req.body.id);
		}
		winning.contest = contest_id;
		winning.rank = rank;
		winning.amount = amount;
		await winning.save();

		if(req.body.id == ''){
			const contest = await Contest.findById(contest_id);
			await contest.winnings.push(winning);
	        await contest.save();
	    }

		req.session.sessionFlash = {
			type: 'success',
			message: 'Winning updated successfully !'
		}
		res.redirect('back');
	},

	delete_winning : async (req, res) => {
		const winning = await Contest.findByIdAndDelete(req.body.id);
		res.send('Winning Deleted');
	},

	update_status : async (req, res) => {
		const contest = await Contest.findById(req.body.contest_id);
		contest.status = req.body.status;
		contest.save();
		!admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
           notification : {
              title : 'New Contest',
              body : 'A new contest is added, Join fast',
              content_available : "true",
              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
           }
        }
        
        const options = {
          priority: "high"
        }
        const users = await User.find({"fcm_token":{$exists:true}}).select(['fcm_token']);
        for(user of users){
            if(user.fcm_token){
                admin.messaging().sendToDevice(user.fcm_token, payload, options);
            }
        }
		res.redirect('back');
	},
}