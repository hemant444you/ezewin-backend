const Setting = require("../Models/Setting.js");
const Contest = require("../Models/Contest.js");
const Winning = require("../Models/Winning.js");
const User = require("../Models/userModel.js");
const Transaction = require("../Models/Transaction.js");
const Payment = require("../Models/Payment.js");
const Quiz = require("../Models/Quiz.js");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const admin = require("firebase-admin");
var serviceAccount = require('../fcm2.json');
const { UniqueString, UniqueNumber, UniqueStringId,UniqueNumberId,
        UniqueOTP,UniqueCharOTP,HEXColor,uuid } = require('unique-string-generator');

module.exports = {
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const upcoming_contests = await Contest.find({status:'Upcoming'}).countDocuments();
		const my_contests = await Contest.find({users:{$in:req.session.user._id}}).countDocuments();
		const transactions = await Transaction.find({user:req.session.user._id}).countDocuments();
		res.render('user/dashboard',{setting,upcoming_contests,my_contests,transactions});
	},
	profile : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const customer = await User.findById(req.session.user._id);
		res.render('user/profile',{customer,setting});
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
	logout : (req, res, next) => {
		req.session.destroy();
    		res.redirect('/login');
	},
	upcoming_contests : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const user = await User.findById(req.session.user._id);
		const contests = await Contest.find({status:'Upcoming'}).lean().populate([
			{ path: 'winnings', select: '_id rank amount',
				options: {
			        sort: { rank: 1},
			    }
			}
		]);
		for(contest of contests){
			const result = await Contest.findById(contest._id).populate('winnings');
			contest.winningsCount = result.winningsCount;
			contest.prizePoll = result.prizePoll;
			contest.quizValue = result.quizValue;
			contest.joined_members = result.joined_members;
			contest.remaining_members = result.remaining_members;
			contest.quizOccuied = result.quizOccuied;
			contest.canJoin = result.canJoin;
			const quiz = await Quiz.findOne({contest:contest._id,user:req.session.user._id});
			if(quiz){
				contest.is_joined = true;
			}else{
				contest.is_joined = false;
			}
		}

		res.render('user/contests',{setting,contests,user});
	},

	my_contests : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const user = await User.findById(req.session.user._id);
		const contests = await Contest.find({users:{$in:req.session.user._id}}).lean().populate([
			{ path: 'winnings', select: '_id rank amount',
				options: {
			        sort: { rank: 1},
			    }
			}
		]);
		for(contest of contests){
			const result = await Contest.findById(contest._id).populate('winnings');
			contest.winningsCount = result.winningsCount;
			contest.prizePoll = result.prizePoll;
			contest.quizValue = result.quizValue;
			contest.joined_members = result.joined_members;
			contest.remaining_members = result.remaining_members;
			contest.quizOccuied = result.quizOccuied;
			contest.canJoin = result.canJoin;

			const quiz = await Quiz.findOne({contest:contest._id,user:req.session.user._id});
			if(quiz){
				contest.is_joined = true;
			}else{
				contest.is_joined = false;
			}
		}

		res.render('user/contests',{setting,contests,user});
	},

	contest_details : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const user = User.findById(req.session.user._id);
		const quizzes = await Quiz.find({contest:req.params.id}).populate('user');
		const contest = await Contest.findById(req.params.id)
		.populate([
			{ path: 'winnings', select: '_id rank amount',
				options: {
			        sort: { rank: 1},
			    }
			}
		])
		.populate([
			{ path: 'quizzes', select: '_id answered_option answered_in rank winning',
				options: {
			        sort: { rank: 1},
			    }
			}
		])
		.populate([
			{ path: 'users', select: '_id Name Email Phone_Number',
				options: {
			        //sort: { rank: 1},
			    }
			}
		])
		.populate([{ path: 'question', select: '-answer'}]);
		res.render('user/contest_details',{setting,contest,user,quizzes});
	},

	join_contest : async (req, res,next) => {
		const contest = await Contest.findOne({_id:req.body.contest_id});
		if(contest){
    		const user = await User.findById(req.session.user._id);
    		const quiz = await Quiz.findOne({contest:req.body.contest_id,user:user._id});
    		if(quiz){
	    		req.session.sessionFlash = {
					type: 'error',
					message: 'Contest Allready joined'
				}
    			res.redirect('back');
    		}else{
    			if(user.wallet >= contest.entry_fee){
    				user.wallet = user.wallet - contest.entry_fee;
    				await user.save();
    				await contest.users.push(user);
    				const quiz = await new Quiz();
    				quiz.contest = contest._id;
    				quiz.user = user._id;
    				await quiz.save();
    				await contest.quizzes.push(quiz);
    				await contest.save();
    				
    				

    				const transaction = new Transaction();
					    transaction.user = user._id;
					    transaction.type = 'Debit';
					    transaction.amount = contest.entry_fee;
					    transaction.wallet = user.wallet;
					    transaction.desc = 'Debited for Joining Contest - contest_id: ' + contest._id;
					    transaction.status = 'Success';
					    await transaction.save();
					    
					!admin.apps.length ?
            	    admin.initializeApp({
                      credential: admin.credential.cert(serviceAccount),
                      databaseURL: "https://jnfdjvnojnf.firebaseio.com"
                    }) : admin.app();
            
                    const payload = { 
                       notification : {
                          title : 'Contest Joined',
                          body : 'Now you are ready to play',
                          content_available : "true",
                          image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
                       }
                    }
                    
                    const options = {
                      priority: "high"
                    }
                    
                    admin.messaging().sendToDevice(user.fcm_token, payload, options);
        
					    
    				req.session.sessionFlash = {
						type: 'success',
						message: 'Contest Joined'
					}
    				res.redirect('back');
    			}else{
    				req.session.sessionFlash = {
						type: 'error',
						essage: 'Insufficient Balance, Please add cash'
					}
    				res.redirect('back');
    			}
    		}
		}else{
		    req.session.sessionFlash = {
				type: 'error',
				message: 'Contest not found or joing not available'
			}
    		res.redirect('back');
		}
		
	},

	add_balance : async (req, res,next) => {
		req.session.sessionFlash = {
			type: 'success',
			message: 'Balance Added'
		}
		res.redirect('back');
	},

	create_razorpay_order : async (req, res,next) => {
		const setting = await Setting.findOne().skip(0);
		const user = await User.findById(req.session.user._id);
		const callback_url = "/user/profile";
		const instance = new Razorpay({
		  key_id: setting.razorpay_key,
		  key_secret: setting.razorpay_secret,
		});

		const amount = req.body.amount;
		const Price = Number(amount)
		try {
		    const options = {
		      amount: Price * 100, // Convert Price to paise
		      currency: 'INR',
		      receipt: crypto.randomBytes(10).toString('hex'),
		    };
		    instance.orders.create(options, (error, response) => {
		      if (error) {
		        req.session.sessionFlash = {
					type: 'error',
					message: 'Order not created'
				}
		        res.redirect('back');
		      } else {
		      	const payment = new Payment();
		      	payment.user = req.session.user._id;
		      	payment.amount = Price;
		      	payment.status = 'Pending';
		      	payment.razorpay_order_id = response.id;
		      	payment.receipt = response.receipt;
		      	payment.save();
		        res.render('user/razorpay_checkout',{response,user,setting,callback_url});
		      }
		    });
		} catch (error) {
			req.session.sessionFlash = {
				type: 'error',
				message: 'Something went wrong'
			}
		    res.redirect('back');
		}
	},

	verify_razorpay_signature : async (req, res,next) => {
		const setting = await Setting.findOne().skip(0);
		const user = await User.findById(req.session.user._id);
		try {
		    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
		    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
		      req.session.sessionFlash = {
				type: 'error',
				message: 'Missing required fields'
			  }
		      res.redirect('/user/profile');
		    }
		    const sign = razorpay_order_id + '|' + razorpay_payment_id;
		    const expectedSign = crypto
		      .createHmac('sha256', process.env.KEY_SECRET)
		      .update(sign)
		      .digest('hex');
		    
		    if (razorpay_signature === expectedSign) {
			  const payment = await Payment.findOne({razorpay_order_id:req.body.razorpay_order_id,status:'Pending'});
			      payment.razorpay_payment_id = razorpay_payment_id;
			      payment.razorpay_signature = razorpay_signature;
			      payment.status = 'Verified';
			      await payment.save();

			      user.wallet = Number(user.wallet) + Number(payment.amount);
			      await user.save();

			      const transaction = new Transaction();
			      transaction.user = req.session.user._id;
			      transaction.type = 'Credit';
			      transaction.amount = payment.amount;
			      transaction.desc = 'Credited from Razorpay - order_id: ' + payment.razorpay_order_id;
			      transaction.wallet = user.wallet;
			      transaction.status = 'Success';
			      await transaction.save();
		      req.session.sessionFlash = {
				type: 'success',
				message: 'Payment success'
			  }
		      res.redirect('/user/profile');
		    } else {
		      req.session.sessionFlash = {
				type: 'error',
				message: 'Invalid signature'
			  }
		      res.redirect('/user/profile');
		    }
		} catch (error) {
		    next(error);
		}

	},

	save_answer : async (req, res,next) => {
		const quiz = await Quiz.findOne({user:req.session.user._id,contest:req.body.contest_id});
		if(!quiz){
			req.session.sessionFlash = {
				type: 'error',
				message: 'You have not joined this contest'
			}
	    	res.redirect('back');
		}else{

			const contest = await Contest.findById(req.body.contest_id).populate('question');

			if(contest.status != 'Opened'){
				req.session.sessionFlash = {
					type: 'error',
					message: 'Contest is not Opened'
				}
	    		res.redirect('back');
			}else{

				if(quiz.answered_option){
					req.session.sessionFlash = {
						type: 'success',
						message: 'Answer saved'
					}
			    	res.redirect('back');
			    }else{
					const now = process.hrtime(contest.hrTime);
					const nanosecondsPassed = now[0] * 1e9 + now[1];
					quiz.answered_option = req.body.answer;
					quiz.answered_in = Math.abs(nanosecondsPassed);
					const answer = contest.question.answer;
			      	const saved_answer = 'option_' + quiz.answered_option;
			      	const latest_quiz = await Quiz.findOne({contest:contest._id, rank:{$gte:0}}).sort({rank:-1});
			      	var i = 1;
			      	var winning_amount = 0;
			      	if(saved_answer == answer){
			      	    if(latest_quiz){
			      		    i = Number(latest_quiz.rank) + 1;
			      	    }
				        const winning = await Winning.findOne({contest:contest._id,rank:i});
				        if(winning){
				        	winning_amount = winning.amount;
				        	winning.user = req.session.user._id;
					        await winning.save();
				        }
				        quiz.rank = i;
				        quiz.winning = winning_amount;
				    }else{
				    	quiz.rank = 0;
				        quiz.winning = 0;
				    }
					await quiz.save();
					req.session.sessionFlash = {
						type: 'success',
						message: 'Answer saved'
					}
					res.redirect('back');
				}
			}
		}
	},

	transaction : async (req, res) => {
		const setting = await Setting.findOne().skip(0)
		const transactions = await Transaction.find({user:req.session.user._id}).populate([
			{ path: 'user', select: '_id Name',
				options: {
			        sort: { created_at: 1},
			    }
			}
		]);
		res.render('user/transaction',{setting,transactions});
	},



	
}