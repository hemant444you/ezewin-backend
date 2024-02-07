const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
var path = require('path');
var hbs = require('hbs');
const fileUpload = require('express-fileupload');

var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

const connectDatabase = require("./config/DBconnect.js");

const frontendRouter = require("./Routes/frontendRoute.js");
const authRouter = require("./Routes/authRoute.js");
const userRouter = require("./Routes/userRoute.js");
const adminRouter = require("./Routes/adminRoute.js");
const apiRouter = require("./Routes/apiRoute.js");
const FrontendController = require('./Controllers/FrontendController');
const scheduledFunctions = require('./task/scheduledFunctions');

const { isUnAuthenticated, isAuthenticated,isAdmin } = require('./middleware/authMiddleware');
const auth = require('./middleware/authMiddlewares');

// Connection to the Database
connectDatabase();

const app = express();

app.use(cookieParser('secret'));
app.use(session({resave :true,saveUninitialized: true,cookie: { maxAge: 6000000000 }}));
app.use(flash());
app.use(fileUpload());


const corsOptions = {
  origin: "*", // Replace * with your actual frontend URL for production
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions)); // Use the cors middleware with your options

// app.use(cors({
//     origin:['http://localhost:4200','http://127.0.0.1:4200',''],
//     credentials:true
// }));

// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', "*");
//   res.header('Access-Control-Allow-Headers', true);
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   next();
// });

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use('/',express.static(path.join(process.cwd(), 'public')));
app.use('/auth',express.static(path.join(process.cwd(), 'public')));
app.use('/user/contest/Upcoming',express.static(path.join(process.cwd(), 'public')));
app.use('/user/contest-details',express.static(path.join(process.cwd(), 'public')));
app.use('/admin',express.static(path.join(process.cwd(), 'public')));
app.use('/admin-auth',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/question',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/contest',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/contest-details',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/notifications',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/newslater',express.static(path.join(process.cwd(), 'public')));
app.use('/admin/setting',express.static(path.join(process.cwd(), 'public')));

hbs.registerPartials(path.join(process.cwd(), 'views/partials'));

hbs.registerHelper("i", function(value)
{
    return parseInt(value) + 1;
});
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper("diffForHumans", function(value)
{
    return value.toLocaleString();
});

hbs.registerHelper("convertPrice", function(value)
{
  if(value.length < 4){
    return value;
  }
  if(value.length == 4){
    return parseInt(value) / 1000 + ' K';
  }
  if(value.length == 5){
    return parseInt(value) / 1000 + ' K';
  }
  if(value.length == 6){
    return parseInt(value) / 100000 + ' Lacs';
  }
  if(value.length == 7){
    return parseInt(value) / 100000 + ' Lacs';
  }
  if(value.length == 8){
    return parseInt(value) / 10000000 + ' Cr';
  }
  if(value.length == 9){
    return parseInt(value) / 10000000 + ' Cr';
  }
});

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(function(req, res, next){
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});

//Frontend
app.use("/",frontendRouter);
app.use("/auth",isUnAuthenticated,authRouter);

// user
app.use("/user",isAuthenticated,userRouter);

//Admin
app.use("/admin",isAdmin,adminRouter);


// ROUTES
app.use("/guest-api", apiRouter);
app.use("/api", auth, apiRouter);

scheduledFunctions.initScheduledJobs();

app.listen(process.env.PORT, async () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});


