const mongoose = require("mongoose");

const connectDatabase= async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
        .then(()=>{console.log("Database Connected")})
        .catch(()=>{console.log("Database is Not Connected")})
    }
    catch(error){
        console.log(error)
    }
};

module.exports = connectDatabase;