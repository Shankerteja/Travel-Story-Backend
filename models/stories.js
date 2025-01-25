const mongoose=require('mongoose')

const storySchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    story:{
        type:String,
        required:true
    },
    isFavourite:{
        type:Boolean,

    },
    visitedDate:{
        type:Date,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    visitedLocations:{
        type:[String],
        required:true
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,ref:"User",required:true
    }
})

const storyModel=mongoose.model("Stories",storySchema);

module.exports=storyModel