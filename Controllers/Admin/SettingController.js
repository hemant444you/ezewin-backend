const Setting = require("../../Models/Setting.js");
const AWS = require('aws-sdk');
const { UniqueString, UniqueNumber, UniqueStringId,UniqueNumberId,
        UniqueOTP,UniqueCharOTP,HEXColor,uuid } = require('unique-string-generator');

module.exports = {
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('admin/setting/index',{setting});
	},

	store : async(req, res) => {
		const setting = await Setting.findById(req.body.id);
		var logo = setting.logo;
		var favicon = setting.favicon;
		if(req.files){
			AWS.config.update({
		        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
		        secretAccesskey: process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
		        region: process.env.AWS_REGION //Region
		    });
		    const s3 = new AWS.S3();
		    if(req.files.logo){
		    	var params = {
				Bucket: 'ezewin',
			        Key: logo,
			}
			s3.deleteObject(params, function(err, data) {
                 		// deleted
			});
			var str = req.files.logo.mimetype;
			var extension = str.substring(str.indexOf("/") + 1);
			logo = UniqueString() + "." + extension;
			// Binary data base64
		    	var fileContent  = Buffer.from(req.files.logo.data, 'binary');
			// Uploading files to the bucket
			var params = {
		        	Bucket: 'ezewin',
		        	Key: logo,
		        	Body: fileContent
		    	};
			await s3.upload(params, function(err, data) {
				if (err) {
			            throw err;
			        }
			});
		    }
		    if(req.files.favicon){
		    	var params = {
				Bucket: 'ezewin',
			        Key: favicon,
			}
			s3.deleteObject(params, function(err, data) {
                 		// deleted
			});
			var str = req.files.favicon.mimetype;
			var extension = str.substring(str.indexOf("/") + 1);
			var filename = UniqueString() + "." + extension;
			// Binary data base64
		    	var fileContent  = Buffer.from(req.files.favicon.data, 'binary');
			// Uploading files to the bucket
			var params = {
		        	Bucket: 'ezewin',
		        	Key: favicon,
		        	Body: fileContent
		    	};
			await s3.upload(params, function(err, data) {
				if (err) {
			            throw err;
			        }
			});
		    }

		}
		const result = await Setting.findByIdAndUpdate(req.body.id,{
			bussiness_name:req.body.bussiness_name,
			logo:logo,
			favicon:favicon,
	        	msg91_key:req.body.msg91_key,
	        	msg91_sender:req.body.msg91_sender,
	        	msg91_flow_id:req.body.msg91_flow_id,
	        	razorpay_key:req.body.razorpay_key,
	        	razorpay_secret:req.body.razorpay_secret,
	        	fcm_key:req.body.fcm_key,
	        	security_amount:req.body.security_amount,
	        	google_map_api_key:req.body.google_map_api_key,
	        	minimum_purchase_year:req.body.minimum_purchase_year,
	        	call_support_number:req.body.call_support_number,
	        	whatsapp_support_number:req.body.whatsapp_support_number,
	        	pagination:req.body.pagination,
	        	cgst:req.body.cgst,
	        	sgst:req.body.sgst,
	        	admin_charge:req.body.admin_charge,
		});
		req.session.sessionFlash = {
			type: 'success',
			message: 'Setting Updated successfully !'
		}
		res.redirect('/admin/setting');
	},

	about_us : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('admin/setting/about_us',{setting});
	},

	update_about_us : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		setting.about_us = req.body.about_us;
		await setting.save();
		req.session.sessionFlash = {
			type: 'success',
			message: 'About us Updated !'
		}
		res.redirect('back');
	},
	

	privacy_policy : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('admin/setting/privacy_policy',{setting});
	},

	update_privacy_policy : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		setting.privacy_policy = req.body.privacy_policy;
		await setting.save();
		req.session.sessionFlash = {
			type: 'success',
			message: 'Privacy Policy Updated !'
		}
		res.redirect('back');
	},

	terms_conditions : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		res.render('admin/setting/terms_conditions',{setting});
	},

	update_terms_conditions : async(req, res) => {
		const setting = await Setting.findOne().skip(0);
		setting.terms_conditions = req.body.terms_conditions;
		await setting.save();
		req.session.sessionFlash = {
			type: 'success',
			message: 'Terms Conditions Updated !'
		}
		res.redirect('back');
	},



}