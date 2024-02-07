const jwt = require("jsonwebtoken");

const generateToken=(id)=>{
    return jwt.sign({ id }, process.env.JWT_SECRET,{
        expiresIn:"30d"
    })
};

const verifyToken = (token) =>{
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            success : true,
            message : decoded.id
        };
    }
    catch(error){
        return {
            success : false,
            message : "Token is invalid"
        };
    };
};



module.exports = { generateToken, verifyToken };