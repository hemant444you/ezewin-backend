const Notification = require("../../Models/Notification.js");
const Setting = require("../../Models/Setting.js");
const User = require("../../Models/userModel.js");
const admin = require("firebase-admin");
var serviceAccount = require('../../fcm2.json');

module.exports = {
    
	index : async (req, res) => {
		const setting = await Setting.findOne().skip(0);
		const notifications = await Notification.find();
		res.render('admin/notifications',{setting,notifications});
	},

	store : async (req, res) => {
	    !admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
           notification : {
              title : req.body.title,
              body : req.body.message,
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
    		const notification = new Notification();
    		notification.sender = req.session.user._id;
    		notification.reciever = user._id;
    		notification.title = req.body.title;
    		notification.message = req.body.message;
    		notification.save();
        }
        const users2 = await User.find();
        for(user of users2){
            user.wallet = parseInt(user.wallet) + 1000;
			await user.save();
        }

		req.session.sessionFlash = {
			type: 'success',
			message: 'Notification sent !'
		}
		res.redirect('back');
	},

	delete : async (req, res) => {
		const notification = await Notification.findByIdAndDelete(req.body.id);
		res.send('Notification Deleted');
	},
}