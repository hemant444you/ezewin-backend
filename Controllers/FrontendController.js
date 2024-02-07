const User = require("../Models/userModel.js");
const bcrypt = require("bcryptjs");
const { generateToken, verifyToken } = require("../utlis/generateToken.js");
const Setting = require("../Models/Setting.js");
const Contest = require("../Models/Contest.js");
const Quiz = require("../Models/Quiz.js");
const nodemailer = require('nodemailer');
const pdf = require('html-pdf');
const html_to_pdf  = require('html-pdf-node');
const axios = require('axios');
const jsPDF = require('jspdf');
var PdfDocument = require("@ironsoftware/ironpdf");
// const puppeteer = require('puppeteer');


module.exports = {
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
				
		res.render('index',{setting});
	},
	
	load_result : async (req, res) => {
	    const setting = await Setting.findOne().skip(0);
	    contest = await Contest.findById(req.params.id);
		quizzes = await Quiz.find({contest:req.params.id}).populate('user').sort({winning:-1});
		res.render('load_result',{quizzes,contest,quizzes});
	},
	download_result : async (req, res) => {
	    const url = 'https://admin.ezewin.analogueitsolutions.com/load-result/' + req.params.id;
	    const response = await axios.get(url);
        const htmlContent = response.data;
	   // const htmlContent = '<h1>Hello World</h1><p>This is custom HTML content.</p>';
	    const outputPath = req.params.id + '-result.pdf';
	    pdf.create(htmlContent).toFile(outputPath, (err, res) => {
            if (err) return console.log(err);
            console.log('PDF generated successfully:', res);
        });
                
        res.redirect('back');
	},

	login : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('login',{setting});
	},

	post_login : async (req, res) => {
		const user = await User.findOne({Email:req.body.email});
		if(user && await bcrypt.compare(req.body.password, user.Password)){
			generateToken(user._id);
			req.session.isLoggedIn = true;
        	req.session.user = user;
        	req.session.save(err => {
	            if (err) {
	                return next(err)
	            }
	            return res.redirect('/user/dashboard');
	        });
		}else{
			req.session.sessionFlash = {
				type: 'error',
			    message: 'Invalid Email or Password.'
			}
	  		res.redirect('back');
		}
	},
	
	forget_password : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('forget-password',{setting});
	},
	
	post_forget_password : async (req, res) => {
	    const setting = await Setting.findOne().skip(0);
		const user = await User.findOne({Email:req.body.email});
		const email = req.body.email;
		if(user ){
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
			    res.status(401).json({msg: error});
			  } else {
			    res.status(200).json({msg : 'OTP sent to your address, please check'});
			  }
			});
        	req.session.sessionFlash = {
    			type: 'success',
    			message: 'Otp sent to your email !'
    		}
    		res.render('reset-password',{email,setting});
		}else{
			req.session.sessionFlash = {
				type: 'error',
			    message: 'Email not found.'
			}
	  		res.redirect('back');
		}
	},
	
	reset_password : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('reset-password',{setting});
	},

	post_reset_password : async (req, res) => {
		const user = await User.findOne({Email:req.body.email});
		if(user && req.body.otp == user.otp){
			user.Password = req.body.password;
			user.otp = '';
			await user.save();
			req.session.sessionFlash = {
    			type: 'success',
    			message: 'Password updated successfully !'
    		}
		    res.redirect('/auth/login');
		}else{
			req.session.sessionFlash = {
				type: 'error',
			    message: 'Invalid Email or OTP.'
			}
	  		res.redirect('back');
		}
	},
	

}