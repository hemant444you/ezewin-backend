const User = require("../Models/userModel.js");

exports.bindUserWithRequest = () => {
    return async (req, res, next) => {
        if (!req.session.isLoggedIn) {
            return next()
        }

        try {
            const user = await User.findById(req.session.user._id)
            req.user = user
            req.isLoggedIn = true
            console.log('req user', req.user)
            next()
        } catch (error) {
            console.log(error)
            next(error)
        }

    }
}

exports.isAuthenticated = async (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/auth/login')
    }
    // const user = await User.findOne({_id:req.session.user._id,isAdmin:false});
    // if(!user){
    // return res.redirect('/admin/dashboard');
    // }
    next();
}

exports.isAdmin = async (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/auth/login')
    }
    const user = await User.findOne({_id:req.session.user._id,isAdmin:true});
    if(!user){
    return res.redirect('/user');
    }
    next();
}

exports.isUnAuthenticated = async (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/user');
    }
    next();
}