const CronJob = require("node-cron");
const Contest = require("../Models/Contest.js");
const Question = require("../Models/Question.js");
const Winning = require("../Models/Winning.js");
const User = require("../Models/userModel.js");
const admin = require("firebase-admin");
var serviceAccount = require('../fcm2.json');

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule("*/1 * * * * *", () => {
    readyContest();
    startContest();
    endContest();
  });

  scheduledJobFunction.start();
  
  const scheduledJobFunction2 = CronJob.schedule("00 08  * * *", () => {
    sendEverydayNotification();
  });
  
  scheduledJobFunction2.start();
  
  
}
async function sendEverydayNotification(req, res){
  const contest = await Contest.findOne({status:'Upcoming'}).sort({rank:1});
  if(contest){
    !admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
          notification : {
              title : 'Hey folks',
              body : 'Next contest is starting on ' + contest.starts_at,
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
  }

}

async function readyContest(req, res){
  var date = new Date();
  var new_date = new Date(date.getTime() + 5*60000);

  // console.log(date.toLocaleString());
  // console.log(new_date.toLocaleString());

  const contests = await Contest.find({status:'Upcoming', starts_at:{$lte: new_date}});
  for(contest of contests){
    contest.status = 'Ready';
    await contest.save();
    !admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
           notification : {
              title : 'Hey folks',
              body : 'The quiz is going to start after 5 minutes. Be ready to play.',
              content_available : "true",
              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
           }
        }
        
        const options = {
          priority: "high"
        }
    const c_contest = await Contest.findOne({_id:contest._id}).populate({
    	path:'users',
    	select:'fcm_token'
    });
    for(user of c_contest.users){
        if(user.fcm_token){
            admin.messaging().sendToDevice(user.fcm_token, payload, options);
        }
    }
  }
}

async function startContest(req, res){
  const time = new Date();
  const contests = await Contest.find({status:'Ready', starts_at:{$lte: time}});
  for(contest of contests){
    const count = await Question.find({'status':'Unused'}).countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuestion = await Question.findOne().skip(randomIndex);
    const hrTime = process.hrtime();
    contest.question = randomQuestion._id;
    contest.status = 'Opened';
    contest.hrTime = hrTime;
    await contest.save();
    
    randomQuestion.status = 'Used';
    await randomQuestion.save();
    
    !admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
           notification : {
              title : 'Contest Opened',
              body : 'Play the quiz and submit your Answer.',
              content_available : "true",
              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
           }
        }
        
        const options = {
          priority: "high"
        }
    const c_contest = await Contest.findOne({_id:contest._id}).populate({
    	path:'users',
    	select:'fcm_token'
    });
    for(user of c_contest.users){
        if(user.fcm_token){
            admin.messaging().sendToDevice(user.fcm_token, payload, options);
        }
    }
  }
}

async function endContest(req, res){
  var date = new Date();
  var new_date = new Date(date.getTime() - 5*60000);
  const contests = await Contest.find({status:'Opened', starts_at:{$lte: new_date}}).populate('question')
  .populate({
    path:'quizzes',
    sort: {answered_in:1},
  });
  
        !admin.apps.length ?
	    admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://jnfdjvnojnf.firebaseio.com"
        }) : admin.app();

        const payload = { 
           notification : {
              title : 'Contest is Completed',
              body : 'Now you can check the result',
              content_available : "true",
              image:"https://i.ytimg.com/vi/iosNuIdQoy8/maxresdefault.jpg"
           }
        }
        
        const options = {
          priority: "high"
        }
  
  for(contest of contests){
    contest.status = 'Completed';
    await contest.save();
    
    const c_contest = await Contest.findOne({_id:contest._id}).populate({
    	path:'users',
    	select:'fcm_token'
    });
    for(user of c_contest.users){
        if(user.fcm_token){
            admin.messaging().sendToDevice(user.fcm_token, payload, options);
        }
    }
  }
}