const mongoose=require('mongoose');


const UserSchema=new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    createdOn:{
        type:Date,
        default:Date.now

    }
})

const userModel=mongoose.model('User',UserSchema);

module.exports=userModel