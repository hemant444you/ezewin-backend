const Question = require("../../Models/Question.js");
const Setting = require("../../Models/Setting.js");
const AWS = require('aws-sdk');
const { UniqueString, UniqueNumber, UniqueStringId,UniqueNumberId,
        UniqueOTP,UniqueCharOTP,HEXColor,uuid } = require('unique-string-generator');

module.exports = {
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const questions = await Question.find();
		res.render('admin/question/index',{questions,setting});
	},

	show : async (req, res) => {
		const question = await Question.findById(1);
		res.render('admin/question/show',{question});	
	},

	store : async (req, res) => {
		const str = req.files.file.mimetype;
		const extension = str.substring(str.indexOf("/") + 1);
		const filename = UniqueString() + "." + extension;
		const {name,option_A,option_B,option_C,option_D,answer} = req.body;
		const question = new Question({
			name:name,
			option_A:option_A,
			option_B:option_B,
			option_C:option_C,
			option_D:option_D,
			answer:answer,
			video:filename,
		});
		const result = await question.save();

		AWS.config.update({
	        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
	        secretAccesskey: process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
	        region: process.env.AWS_REGION //Region
	    });
	    const s3 = new AWS.S3();

	    // Binary data base64
	    const fileContent  = Buffer.from(req.files.file.data, 'binary');
	    // Setting up S3 upload parameters
	    const params = {
	        Bucket: 'ezewin',
	        Key: filename, // File name you want to save as in S3
	        Body: fileContent,
	        ContentType: str
	    };
		// Uploading files to the bucket
	    await s3.upload(params, function(err, data) {
	        if (err) {
	            throw err;
	        }
	    });

		req.session.sessionFlash = {
			type: 'success',
			message: 'Question Added successfully !'
		}
		res.redirect('/admin/question');
	},

	update : async (req, res) => {
		const question = await Question.findById(req.body.id);
		var filename = question.video;
		if(req.files){
			AWS.config.update({
		        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
		        secretAccesskey: process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
		        region: process.env.AWS_REGION //Region
		    });
		    const s3 = new AWS.S3();
		    const params = {
		        Bucket: 'ezewin',
		        Key: filename,
		    };
		    s3.deleteObject(params, function(err, data) {
			  if (err) console.log(err, err.stack);  // error
			  else     console.log();                 // deleted
			});

			const str = req.files.file.mimetype;
			const extension = str.substring(str.indexOf("/") + 1);
			filename = UniqueString() + "." + extension;
			// Binary data base64
		    const fileContent  = Buffer.from(req.files.file.data, 'binary');
			// Uploading files to the bucket
			const uploadparams = {
		        Bucket: 'ezewin',
		        Key: filename,
		        Body: fileContent,
		        ContentType: str
		    };
		    await s3.upload(uploadparams, function(err, data) {
		        if (err) {
		            throw err;
		        }
		    });
		}
		
		const {name,option_A,option_B,option_C,option_D,answer} = req.body
		const result = await Question.findByIdAndUpdate(req.body.id,{
			name:name,
			option_A:option_A,
			option_B:option_B,
			option_C:option_C,
			option_D:option_D,
			answer:answer,
			video:filename,
		});

		req.session.sessionFlash = {
			type: 'success',
			message: 'Question updated successfully !'
		}
		res.redirect('/admin/question');
	},

	delete : async (req, res) => {
		const question = await Question.findByIdAndDelete(req.body.id);
		AWS.config.update({
	        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
	        secretAccesskey: process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
	        region: process.env.AWS_REGION //Region
		});
		const s3 = new AWS.S3();
		const params = {
		    Bucket: 'ezewin',
		    Key: question.video,
		};
		s3.deleteObject(params, function(err, data) {
			if (err) console.log(err, err.stack);  // error
			  else     console.log();                 // deleted
		});
		res.send('Question Deleted');
	},


}