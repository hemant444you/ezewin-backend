const Contest = require("../Models/Contest.js");
const Winning = require("../Models/Winning.js");
const User = require("../Models/userModel.js");
const Setting = require("../Models/Setting.js");
const Transaction = require("../Models/Transaction.js");
const Quiz = require("../Models/Quiz.js");
const Newslater = require("../Models/Newslater.js");
const Payment = require("../Models/Payment.js");
const Notification = require("../Models/Notification.js");
const bcrypt = require("bcryptjs");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateToken, verifyToken } = require("../utlis/generateToken.js");
const AWS = require('aws-sdk');
const admin = require("firebase-admin");
var serviceAccount = require('../fcm2.json');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const fs = require('fs');

const { UniqueString, UniqueNumber, UniqueStringId,UniqueNumberId,
        UniqueOTP,UniqueCharOTP,HEXColor,uuid } = require('unique-string-generator');
        
//PASSWORD VALIDATION
isValidPassword=(Password)=>{
    return(
        Password.length >=5 && /[A-Z]/.test(Password) && /[a-z]/.test(Password) && /\d/.test(Password)
    );
};

module.exports = {
	first_upcoming : async (req, res) => {
		const contest = await Contest.findOne({$or:[{status:'Upcoming'},{status:'Ready'},{status:'Ready'}]}).sort({starts_at:1});
		res.status(200).json({contest});
	},
	latest_contest : async (req, res) => {
		const latest_contest = await Contest.findOne({status:'Completed',_id:'65c1c5ebe40f8a7bac273e82'}).sort({starts_at:-1});
		const winningsCount = await Winning.find({contest:latest_contest._id}).countDocuments();
		const contest = await Contest.findOne({status:'Completed',_id:'65c1c5ebe40f8a7bac273e82'}).sort({starts_at:-1}).limit(1).populate({
			path: 'quizzes',
			match: { winning: { $gte: 1 } },
			limit: winningsCount,
			options: {
    		    sort:{ winning: -1},
    		},
			populate:{
				path:'user',
				select:'Name Email Phone_Number address photo',
			},
		});

		if(contest.quizzes){
			for(quiz of contest.quizzes){
				if(quiz.user != null){
				    if(quiz.user.photo != null){
    				    quiz.user.photo = quiz.user.photo_path
    			    }else{
    			        quiz.user.photo = null;
    			    }
				}
			}
		}
		res.status(200).json({contest});
	},
	newslater : async (req, res) => {
		const newslaterExists = await Newslater.findOne({email:req.body.email});
		if(newslaterExists){
			res.status(401).json({ message : "User Already have subscribed to our newslater" });
		}else{
			const newslater = new Newslater();
			newslater.email = req.body.email;
			await newslater.save();
			res.status(200).json({msg:'Subscribed to our newslater'});
		}
	},
	register : async (req, res) => {
        const { Name, Email, Phone_Number, Gender, Password } = req.body;
        const userExists = await User.findOne({ $and : [{Email}, {Phone_Number}] });
        if(!userExists){
            if(isValidPassword(Password)){
                const Newuser = await User.create({ Name, Email,Phone_Number, Gender, Password });
                if(Newuser){
                    res.status(200).json({ message : "Registration Successful", token : generateToken(Newuser)});
                }else{
                    res.status(401).json({ message : "Invalid User Data" });
                };
            }else{
                res.status(401).json({ message : "Invalid password" });
            };
        }else{
            res.status(401).json({ message : "User Already registered" });
        }

	},
	login : async (req, res) => {
		
        const { Email, Password, Phone_Number } = req.body
        const userExists = await User.findOne({ $or : [{ Email }, { Phone_Number }] });
        if(userExists){
            if(await userExists.matchPassword(Password)){
                if(req.body.fcm_token != undefined){
                    userExists.fcm_token = req.body.fcm_token;
                }
	            userExists.save();
                res.status(200).json({ message : "Login Successful", _id : userExists._id,  Name : userExists.Name, Token : generateToken(userExists._id) });
            }else{
                res.status(401).json({ message : "Password is wrong" });
            }
        }else{
            res.status(404).json({ message : "User not found" });
        }
	},
	forget_password : async (req, res) => {
		const user = await User.findOne({ $or : [{ Email:req.body.email }, { Phone_Number:req.body.phone }] });
		if(user){
			user.otp = Math.floor(1000 + Math.random() * 9000);
			await user.save();
			//send otp

			var transporter = nodemailer.createTransport({
			  service: 'smtp',
			  host: 'mail.eze-win.com',
			  port: '465',
			  secure: 'true',
			  auth: {
			    user: 'info@eze-win.com',
			    pass: 'Analogue@123'
			  }
			});

			var mailOptions = {
			  from: 'info@eze-win.com',
			  to: req.body.email,
			  subject: 'Forget Password',
			  text: 'Your one time assword is ' + user.otp
			};

			transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
			 //   console.log(error);
			    res.status(401).json({msg: error});
			  } else {
			    res.status(200).json({msg : 'Otp sent to your address, please check'});
			  }
			}); 

		}else{
			res.status(401).json({msg: 'User not found'});
		}

	},
	reset_password : async (req, res) => {
		const user = await User.findOne({ $or : [{ Email:req.body.email }, { Phone_Number:req.body.phone }] });
		if(req.body.otp == user.otp){
			user.Password = req.body.password;
			user.otp = '';
			await user.save();
			res.status(200).json({msg : 'Password updated'});
		}else{
			res.status(401).json({msg: 'Invalid Otp'});
		}
	},

	profile : async (req, res) => {
		const user = await User.findById(req.user.id).select(['-Password', '- otp', '-isAdmin']);
		if(user.photo){
		    user.photo = user.photo;
		}else{
		    user.photo = '';
		}
		res.status(200).json({user : user});
	},
	update_profile : async (req, res) => {
		const user = await User.findById(req.user.id);
		var photo = user.photo;
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
			    Key: photo,
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
		const result = await User.findByIdAndUpdate(user._id,{
			Name:req.body.name,
			//Email:req.body.email,
			//Phone_Number:req.body.phone,
			Gender:req.body.gender,
			address:req.body.address,
			photo:photo,
		});

		res.status(200).json({message : "Profile Updated"});

	},
	change_password : async (req, res) => {
		const user = await User.findById(req.user.id);
		const {old_password, new_password} = req.body;
		if(user && await bcrypt.compare(old_password, user.Password)){
			user.Password = new_password;
			user.save();
			res.status(200).json({message : "Password Updated"});
		}else{
			res.status(401).json({message : "Invalid old password"});
		}
	},

	setting : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.status(200).json({data : setting});
	},

	create_razorpay_order : async (req, res, next) => {
		const setting = await Setting.findOne().skip(0);
		const instance = new Razorpay({
		  key_id: setting.razorpay_key,
		  key_secret: setting.razorpay_secret,
		});
		try {
		    const { Price } = req.body;
		    // Ensure Price is a valid number (in paise)
		    if (typeof Price !== 'number' || Price <= 0) {
		      return res.status(401).json({ message: 'Invalid Price' });
		    }
		    const options = {
		      amount: Price * 100, // Convert Price to paise
		      currency: 'INR',
		      receipt: crypto.randomBytes(10).toString('hex'),
		    };
		    instance.orders.create(options, (error, order) => {
		      if (error) {
		        res.status(401).json({ message: 'Something went wrong' });
		      } else {
		      	const payment = new Payment();
		      	payment.user = req.user.id;
		      	payment.amount = Price;
		      	payment.status = 'Pending';
		      	payment.razorpay_order_id = order.id;
		      	payment.receipt = order.receipt;
		      	payment.save();

		        res.status(200).json({ data: order });
		      }
		    });
		} catch (error) {
		    next(error);
		}
	},
	verify_razorpay_signature : async (req, res, next) => {
		try {
		    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
		    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
		      return res.status(401).json({ message: 'Missing required fields' });
		    }
		    const sign = razorpay_order_id + '|' + razorpay_payment_id;
		    const expectedSign = crypto
		      .createHmac('sha256', process.env.KEY_SECRET)
		      .update(sign)
		      .digest('hex');
		    
		    if (razorpay_signature === expectedSign) {
		      const payment = await Payment.findOne({razorpay_order_id:req.body.razorpay_order_id,status:'Pending'});
		      if(payment){
			      payment.razorpay_payment_id = razorpay_payment_id;
			      payment.razorpay_signature = razorpay_signature;
			      payment.status = 'Verified';
			      await payment.save();

			      const user = await User.findById(req.user.id);
			      user.wallet = parseInt(user.wallet) + parseInt(payment.amount);
			      await user.save();

			      const transaction = new Transaction();
			      transaction.user = req.user.id;
			      transaction.type = 'Credit';
			      transaction.amount = payment.amount;
			      transaction.desc = 'Credited from Razorpay - order_id: ' + payment.razorpay_order_id;
			      transaction.status = 'Success';
			      transaction.wallet = user.wallet;
			      await transaction.save();
			      
			      !admin.apps.length ?
                	    admin.initializeApp({
                          credential: admin.credential.cert(serviceAccount),
                          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
                        }) : admin.app();
                
                        const payload = { 
                           notification : {
                              title : 'Payment Success',
                              body : 'You have successfully added' + payment.amount + 'Avl Bal is Rs' + user.wallet,
                              content_available : "true",
                              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
                           }
                        }
                        
                        const options = {
                          priority: "high"
                        }
                        
                        if(user.fcm_token){
                            admin.messaging().sendToDevice(user.fcm_token, payload, options);
                        }
			      
		      	  res.status(200).json({ message: 'Amount added in your wallet' });
		      }else{
		      	res.status(200).json({ message: 'Payment verification successfull' });
		      }
		    } else {
		      res.status(401).json({ message: 'Invalid signature sent' });
		    }
		} catch (error) {
		    next(error);
		}
	},
	withdraw_request : async (req, res) => {
		
	},

	upcoming_contest : async (req, res) => {
		const contests = await Contest.find({status:'Upcoming'}).lean();
		for(contest of contests){
			const result = await Contest.findById(contest._id).populate('winnings');
			contest.winningsCount = result.winningsCount;
			contest.prizePoll = result.prizePoll;
			contest.quizValue = result.quizValue;
			contest.joined_members = result.joined_members;
			contest.remaining_members = result.remaining_members;
			contest.quizOccuied = result.quizOccuied;
			contest.canJoin = result.canJoin;

			const quiz = await Quiz.findOne({contest:contest._id,user:req.user.id});
			if(quiz){
				contest.is_joined = true;
			}else{
				contest.is_joined = false;
			}
		}
		res.status(200).json({data : contests});
	},
	opened_contest : async (req, res) => {
		const contests = await Contest.find({'users': { $in: req.user.id },status:'Opened',answered_option:{$exists:false}}).sort({starts_at:1});
		res.status(200).json({data : contests});
	},

	join_contest : async (req, res,next) => {
		const contest = await Contest.findById(req.body.contest_id);
		const quizes_count = await Quiz.find({contest:contest._id}).countDocuments();
		if(contest){
		    if(quizes_count < contest.max_members){
    		const user = await User.findById(req.user.id);
    		const quiz = await Quiz.findOne({contest:req.body.contest_id,user:req.user.id});
    		if(contest.status != 'Upcoming'){
    			res.status(401).json({message : "Joining is unavailable"});
    		}else{
    			if(quiz){
    				res.status(401).json({message : 'Contest Already Joined'});
    			}else{
    				if(user.wallet >= contest.entry_fee){
    					user.wallet = parseInt(user.wallet) - parseInt(contest.entry_fee);
    					await user.save();
    					await contest.users.push(user);
    					const quiz = await new Quiz();
    					quiz.contest = contest._id;
    					quiz.user = req.user.id;
    					await quiz.save();
    					await contest.quizzes.push(quiz);
    					await contest.save();

    					const transaction = new Transaction();
					    transaction.user = req.user.id;
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
                              title : 'Congratulations',
                              body : 'You have successfully joined the contest',
                              content_available : "true",
                              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
                           }
                        }
                        
                        const options = {
                          priority: "high"
                        }
                        if(user.fcm_token){
                            admin.messaging().sendToDevice(user.fcm_token, payload, options);
                        }
                        
    					res.status(200).json({message : "Contest joined"});
    				}else{
    					res.status(401).json({message : "Insufficient Balance, Please add cash"});
    				}
    			}
    		}
		    }else{
		        res.status(401).json({message : "Contest full"});
		    }
		}else{
		    res.status(401).json({message : "Contest not found"});
		}
		
	},
	save_answer : async (req, res) => {
		const contest = await Contest.findById(req.body.contest_id).populate('question');
		if(contest){
    		const quiz = await Quiz.findOne({contest:req.body.contest_id,user:req.user.id});
    		if(quiz){
	    		if(contest.status == 'Opened'){
	    			if(quiz.answered_option){
	    				res.status(401).json({message : "Answer allready saved"});
	    			}else{
	    				const now = process.hrtime(contest.hrTime);
						const nanosecondsPassed = now[0] * 1e9 + now[1];
						quiz.answered_option = req.body.answer;
						quiz.answered_in = Math.abs(nanosecondsPassed);
						const answer = contest.question.answer;
				      	const saved_answer = 'option_' + quiz.answered_option;
				    //   	const latest_quiz = await Quiz.findOne({contest:contest._id, rank:{$gte:0}}).sort({rank:-1});
				      	var i = 1;
				      	var winning_amount = 0;
				    //   	if(latest_quiz){
				    //   		i = Number(latest_quiz.rank) + 1;
				    //   	}
				      	if(saved_answer == answer){
				      	    if(contest.rank > 0){
				      	        i = Number(contest.rank) + 1;
				      	    }
				      	    contest.rank = i;
					        await contest.save();
					        
					        const winning = await Winning.findOne({contest:contest._id,rank:i});
					        if(winning){
					        	winning_amount = winning.amount;
					        	winning.user = req.user.id;
					        	await winning.save();
					        }
					        quiz.rank = i;
					        quiz.winning = winning_amount;
					    }else{
					    	quiz.rank = 0;
					        quiz.winning = 0;
					    }
						await quiz.save();

	    				res.status(200).json({message : "Answer Saved,Please wait for result"});
	    			}
	    		}else{
	    			res.status(401).json({message : "you cant save your answer"});
	    		}
	    	}else{
	    		res.status(401).json({message : "you have not joined this contest"});
	    	}
		}else{
		    res.status(401).json({message : "Contest not found"});
		}
	},

	contest_details : async (req, res) => {
	    const my_quiz = await Quiz.findOne({contest:req.body.contest_id,user:req.user.id})
	    .populate({
    				path:'user',
    				select:'Name Email Phone_Number photo'
    			});
	    if(my_quiz){
	        if(my_quiz.user != null){
	            my_quiz.user.photo = my_quiz.user.photo_path;
	        }
    		const contest = await Contest.findById(req.body.contest_id).populate({
    			path:'winnings',
    			populate:{
    				path:'user',
    				select:'Name Email Phone_Number address photo',
    			},
    
    		}).populate({
    			path:'question',
    			select:'-answer'
    			
    		}).populate({
    			path: 'quizzes',
    			limit:10,
    			skip:0,
    			options: {
    			        sort: { winning: -1},
    			    },
    			populate:{
    				path:'user',
    				select:'Name Email Phone_Number photo'
    			},
    		});
    		if(contest){
    			if(contest.question){
    				contest.question.video = contest.question.video_path;
    			}
    			if(contest.quizzes){
    				for(quiz of contest.quizzes){
    					if(quiz.user != null){
    					    if(quiz.user.photo != null){
    						    quiz.user.photo = quiz.user.photo_path
    					    }
    					}
    				}
    			}
    			if(contest.winnings){
    				for(winning of contest.winnings){
    					if(winning.user != null){
    					    if(winning.user.photo != null){
    						    winning.user.photo = winning.user.photo_path
    					    }else{
            			        winning.user.photo = null;
            			    }
    					}
    				}
    			}
    		    res.status(200).json({contest, my_quiz});
    		}else{
    		    res.status(401).json({message : "Contest not found"});
    		}
	    }else{
	        res.status(401).json({message : "you have not joined this contest"});
	    }
	},
	load_quizzes : async (req, res) => {
	    var limit = 10;
	    var page = req.body.page || 1;
	    var skip = (page - 1) * limit;
	    const my_quiz = await Quiz.findOne({contest:req.body.contest_id,user:req.user.id});
	    if(my_quiz){
            
            const quizzes = await Quiz.find({contest:req.body.contest_id}).select(['answered_in', 'answered_option','rank','winning']).limit(limit).skip(skip)
            .sort({winning: -1,answered_in:1})
            .populate({
                path:'user',
    			select:'Name Email Phone_Number photo'
            });
            if(quizzes){
                for(quiz of quizzes){
    				if(quiz.user != null){
    				    if(quiz.user.photo != null){
    				        quiz.user.photo = quiz.user.photo_path
    					}
    			    }
    			}
    			res.status(200).json({quizzes});
            }else{
    		    res.status(401).json({message : "Quiz not found"});
    		}
	    }else{
	        res.status(401).json({message : "you have not joined this contest"});
	    }
	},
	my_contests : async (req, res) => {
		const upcoming_contests = await Contest.find({'users': { $in: req.user.id },status:'Upcoming'}).sort({starts_at:1});
        const ready_contests = await Contest.find({'users': { $in: req.user.id },status:'Ready'}).sort({starts_at:1});
        const opened_contests = await Contest.find({'users': { $in: req.user.id },status:'Opened'}).sort({starts_at:1});
        const completed_contests = await Contest.find({'users': { $in: req.user.id },status:'Completed'}).sort({starts_at:-1});
		res.status(200).json({opened_contests,ready_contests,upcoming_contests,completed_contests});
		
	},
	download_contest : async (req, res) => {
	    
    		const file = 'https://admin.ezewin.analogueitsolutions.com/result.pdf';
    		res.status(200).json({data : file});
    },
	transactions : async (req, res) => {
		const transactions = await Transaction.find({user:req.user.id}).sort({createdAt:-1});
		res.status(200).json({data : transactions});
	},

	notifications : async (req, res) => {
		var limit = 10;
	    var page = req.body.page || 1;
	    var skip = (page - 1) * limit;
		const notifications = await Notification.find().limit(limit).skip(skip).sort({createdAt:-1});
		const unread_notifications = await Notification.find({'status':'Unread'}).countDocuments();
		res.status(200).json({data : notifications,unread_notifications});
	},
	
	read_notification : async (req, res) => {
		const notification = await Notification.findOne({'_id':req.body.id});
		notification.status = 'Read';
		await notification.save();
		res.status(200).json({data : notification});
	},

	logout : async (req, res) => {
        //
        res.send(200,'Log out from your local by deleting token');
	},
}