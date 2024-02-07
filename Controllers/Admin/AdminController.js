const User = require("../../Models/userModel.js");
const Contest = require("../../Models/Contest.js");
const Question = require("../../Models/Question.js");
const Setting = require("../../Models/Setting.js");
const Transaction = require("../../Models/Transaction.js");
const Payment = require("../../Models/Payment.js");
const Notification = require("../../Models/Notification.js");
const Newslater = require("../../Models/Newslater.js");
const bcrypt = require("bcryptjs");
const AWS = require('aws-sdk');
const { UniqueString, UniqueNumber, UniqueStringId,UniqueNumberId,
        UniqueOTP,UniqueCharOTP,HEXColor,uuid } = require('unique-string-generator');

module.exports = {

	dashboard : async (req, res) => {
		try{
			const admins = await User.find({isAdmin:true}).countDocuments();
			const users = await User.find({isAdmin:false}).countDocuments();
			const upcoming_contest = await Contest.find({status:'Upcoming'}).countDocuments();
			const ready_contest = await Contest.find({status:'Ready'}).countDocuments();
			const opened_contest = await Contest.find({status:'Opened'}).countDocuments();
			const completed_contest = await Contest.find({status:'Completed'}).countDocuments();
			const unused_questions = await Question.find({status:'Unused'}).countDocuments();
			const used_questions = await Question.find({status:'Used'}).countDocuments();
			const setting = await Setting.findOne().skip(0);

			res.render('admin/dashboard',{admins,users,upcoming_contest,ready_contest,opened_contest,completed_contest,unused_questions,used_questions,setting});
		}catch(err){
			//
		}
		
	},

	logout : (req, res, next) => {
		req.session.destroy();
    		res.redirect('/auth/login');
	},

	profile : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const customer = await User.findById(req.session.user._id);
		res.render('admin/profile',{customer,setting});
	},
	update_profile : async (req, res) => {
		var photo = req.session.user.photo;
		if(req.files){
			AWS.config.update({
		        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
		        secretAccesskey: process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
		        region: process.env.AWS_REGION //Region
		    });
		    const s3 = new AWS.S3();
		    if(req.files.profile_pic){
		    	var params = {
				Bucket: 'ezewin',
			    Key: req.session.user.photo,
			}
			s3.deleteObject(params, function(err, data) {
                 		// deleted
			});
			var str = req.files.profile_pic.mimetype;
			var extension = str.substring(str.indexOf("/") + 1);
			profile_pic = UniqueString() + "." + extension;
			// Binary data base64
		    	var fileContent  = Buffer.from(req.files.profile_pic.data, 'binary');
			// Uploading files to the bucket
			var params = {
		        	Bucket: 'ezewin',
		        	Key: profile_pic,
		        	Body: fileContent,
		        	ContentType: str
		    	};
			await s3.upload(params, function(err, data) {
				if (err) {
			            throw err;
			        }
			});
			photo = profile_pic;
		    }
		}
		const result = await User.findByIdAndUpdate(req.session.user._id,{
			Name:req.body.name,
			Email:req.body.email,
			Phone_Number:req.body.phone,
			Gender:req.body.gender,
			address:req.body.address,
			photo:photo,
		});

		req.session.sessionFlash = {
			type: 'success',
			message: 'Profile updated successfully !'
		}
		res.redirect('back');
	},

	user : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const users = await User.find()
		res.render('admin/user/index',{users,setting});
	},

	user_details : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const user = await User.findById(req.params.id);
		const upcoming_contests = await Contest.find({status:'Upcoming','users': { $in: req.params.id}});
		const completed_contests = await Contest.find({status:'Completed','users': { $in: req.params.id}});
		const transactions = await Transaction.find({user:req.params.id});

		res.render('admin/user/show',{user,setting,upcoming_contests,completed_contests,transactions});
	},

	store : async (req, res) => {
		const user = new User({
			Name:req.body.name,
			Email:req.body.email,
			Phone_Number:req.body.phone,
			Password:'Password@123',
		});
		const result = await user.save();
		req.session.sessionFlash = {
			type: 'success',
			message: 'User Added successfully !'
		}
		res.redirect('/admin/user');
	},

	update : async (req, res) => {
		const result = await User.findByIdAndUpdate(req.body.id,{
			Name:req.body.name,
			Email:req.body.email,
			Phone_Number:req.body.phone,
		});

		req.session.sessionFlash = {
			type: 'success',
			message: 'User updated successfully !'
		}
		res.redirect('/admin/user');
	},

	delete : async (req, res) => {
		const user = await User.findByIdAndDelete(req.body.id);
		res.send('User Deleted');
	},

	setting : (req, res) => {
		res.render('admin/setting/index');
	},

	transaction : async (req, res) => {
		const setting = await Setting.findOne().skip(0)
		const transactions = await Transaction.find().populate([
			{ path: 'user', select: '_id Name',
				options: {
			        sort: { created_at: 1},
			    }
			}
		]);
		res.render('admin/transaction',{setting,transactions});
	},

	payment : async (req, res) => {
		const setting = await Setting.findOne().skip(0)
		const payments = await Payment.find().populate([
			{ path: 'user', select: '_id Name',
				options: {
			        sort: { created_at: 1},
			    }
			}
		]);
		res.render('admin/payment',{setting,payments});
	},

	newslater : async (req, res) => {
		const setting = await Setting.findOne().skip(0)
		const newslaters = await Newslater.find();
		res.render('admin/newslater',{setting,newslaters});
	},

	delete_newslater : async (req, res) => {
		const newslaters = await Newslater.findByIdAndDelete(req.body.id);
		res.send('Newslater Deleted');
	},
}