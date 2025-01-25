const express=require('express')
const mongoose=require('mongoose');
const cors=require('cors')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const dotEnv=require('dotenv')
const fs=require("fs")
const path=require("path")
const Authonticate=require('./Middlewares/Authonticate')
const storyModel=require('./models/stories')
const upload=require('./Middlewares/ImageUpload')
const app=express()
const port=process.env.PORT || 3000
app.use(express.json())
app.use(cors({origin:'*'}))
const User=require('./models/User');
const { error } = require('console');
const { request } = require('http');
dotEnv.config()

//MongoDB Connection
try {
    mongoose.connect(process.env.MONGO_URL)
    console.log('DB connected')
} catch (error) {
    console.log("error",error)
    
}

//Register Api
app.post('/create-user',async (request,response)=>{
    const {fullName,email,password}=request.body;

    if(!fullName || !email || !password){
       return response.json({message:"All Flieds Required"})
    }
    const userDetails=await User.findOne({email});

    if(userDetails){
      return  response.status(400).json({error:true,message:"User Already Found Create Another Account.."})
    }

    const hashedPassword=await bcrypt.hash(password,10);

    const createuser=new User({
        fullName,
        email,
        password:hashedPassword
    })
    await createuser.save()
    const accessToken=jwt.sign({userId:createuser._id},process.env.SECRECT_KEY,{expiresIn:'72h'})

    response.status(201).json({
        error:false,
        message:"Registered SuccessFully",
        user:{fullName:createuser.fullName,email:createuser.email,password:createuser.password,createdOn:createuser.createdOn},
        accessToken

    })
})

//login Api

app.post('/login',async(request,response)=>{
    const {email,password}=request.body 
    if(!email || !password){
       return response.status(400).json({message:"Provide All flieds"})
    }
    const user=await User.findOne({email})

    if(!user){
       return response.status(400).json({message:'Invalid Credentails'});
    }
    const isValidPassword=await bcrypt.compare(password,user.password);

    if(!isValidPassword){
        return response.status(400).json({message:"Invalid Credentials"})
    }

    const accessToken=jwt.sign({userId:user._id},process.env.SECRECT_KEY,{expiresIn:'72h'});

    response.status(200).json({
        error:false, 
        message:'Login SuccessFull',
        user:{
            fullName:user.fullName,email:user.email
        },
        accessToken
    })
})

//get userDetails

app.get('/get-user',Authonticate,async(request,response)=>{
    const {userId}=request.user;

    const user=await User.findOne({_id:userId})

    if(!user){
        return response.sendStatus(401);
    }

    response.status(200).json({
        error:false,
        user,
        message:"User Details"
    })
})

//Add-Story

app.post('/add-story',Authonticate,async(request,response)=>{
    const {title,story,imageUrl,vistedDate,visitedLocations,isFavourite}=request.body;
    const {userId}=request.user

    if(!title || !story || !vistedDate || !imageUrl || !visitedLocations){
       return response.status(400).json({message:"All fileds Required"})
    }

    const parsedDate=new Date(parseInt(vistedDate));
    const placeholderImage=`http://localhost:3000/uploads/placeholder.jpg`;

    const addStory=new storyModel({
        title,
        story,
        imageUrl:imageUrl || placeholderImage,
        isFavourite,
        visitedDate:parsedDate,
        visitedLocations:visitedLocations,
        userId:userId
    })
    await addStory.save()

    response.status(201).json({
        error:false,
        story:addStory,
        message:"Story Added SuccessFully"
    })

})

//get-all-stores Api 

app.get('/get-all-stories',Authonticate,async(request,response)=>{
    const {userId}=request.user 

    try {
        const storiesDetails=await storyModel.find({userId:userId}).sort({isFavourite:-1})

    response.status(200).json({
        error:false,
        message:"successful Request",
        stories:storiesDetails,
    })
        
    } catch (error) {
        console.log("error",error)
        
    }

})

//image upload into uploads folder
app.post('/image-upload',upload.single('image'),async(request,response)=>{
   try {
    if(!request.file){
        return response.status(400).json({message:'image Not Uploaded'})
    }

    const imageUrl=`http://localhost:3000/uploads/${request.file.filename}`
    response.status(201).json({message:"Image Uploaded SuccessFully",imageUrl})
    
   } catch (error) {
    response.status(500).json({message:"Server Error"})
    
   }
})

//image delete from uploads folder 
app.delete('/image-delete',(request,response)=>{
    const {imageUrl}=request.query 
    const filename=path.basename(imageUrl);
    const filepath=path.join(__dirname,'uploads',filename);

    if(fs.existsSync(filepath)){
        fs.unlinkSync(filepath)
        response.status(200).json({message:"Image Deleted SuccessFully"})
    }else{
        response.status(400).json({message:"Image Not Found"})
    }
})

app.use('/uploads',express.static("uploads"))
app.use('/assets',express.static(path.join(__dirname,"assets")))

//update story 
app.put('/edit-post/:id',Authonticate,async(request,response)=>{
    const {id}=request.params 
    const {title,story,imageUrl,vistedDate,visitedLocations,isFavourite}=request.body;
    const {userId}=request.user

    if(!title || !story || !vistedDate || !visitedLocations){
       return response.status(400).json({message:"All fileds Required"})
    }

    const parsedDate=new Date(parseInt(vistedDate));
    const travelstory=await storyModel.findOne({userId,_id:id});
    
    if(!travelstory){
        response.status(404).json({message:"Travel story Not Found"})

    }
    const placeholderImage=`http://localhost:3000/assets/placeholder.jpg`;
    travelstory.title=title
    travelstory.story=story
    travelstory.visitedDate=parsedDate
    travelstory.visitedLocations=visitedLocations
    travelstory.isFavourite=isFavourite
    travelstory.imageUrl=imageUrl || placeholderImage

    await travelstory.save()
    response.status(200).json({
        error:false,
        message:"Updated SuccessFully",
        story:travelstory,
    })
    
})


//delete story 

app.delete('/delete-story/:id',Authonticate,async (request,response)=>{
    const {id}=request.params 
    const {userId}=request.user 
    const travelstory=await storyModel.findOne({_id:id,userId})
    if(!travelstory){
       return response.status(404).json({message:"Travel Story Not Found"})
    }
    await storyModel.deleteOne({_id:id,userId})
    response.status(200).json({message:"Story Deleted SuccessFully",error:false})
})

//update favourite 

app.post('/update-favourite/:id',Authonticate,async (request,response)=>{
    const {userId}=request.user 
    const {id}=request.params
    const {isFavourite}=request.body  

    const travelstory=await storyModel.findOne({_id:id,userId})

    if(!travelstory){
        return response.status(404).json({message:"Travel Story Not Found"})
    }
    travelstory.isFavourite=isFavourite
    await travelstory.save()

    response.status(200).json({message:"Favourite updated Successfully",error:false,story:travelstory})
    

})

//search filter 

app.get('/search',Authonticate,async(request,response)=>{
    const {query}=request.query
    const {userId}=request.user 
    if(!query){
        return response.status(400).json({message:"Query Required"})
    }
    const travelRecords=await storyModel.find({userId,
        $or:[
            {title:{$regex:query,$options:"i"}},
            {story:{$regex:query,$options:"i"}},
            {visitedLocations:{$regex:query,$options:"i"}},
        ]
    }).sort({isFavourite:-1})
    response.status(200).json({stories:travelRecords,error:false,message:"Applied Filtered"})
})

//filter with date range

app.get('/filter-by-date',Authonticate,async(request,response)=>{
    const {userId}=request.user
    const {startDate,endDate}=request.query 

    try {
        const parsedStartDate=new Date(parseInt(startDate))
        const parsedEndDate=new Date(parseInt(endDate));

        const travelRecords=await storyModel.find({userId,
            visitedDate:{$gte:parsedStartDate,$lte:parsedEndDate}
        }).sort({isFavourite:-1})
        response.status(200).json({stories:travelRecords})
    } catch (error) {
        response.status(500).json("server Error")
        
    }
})



//checking api
app.get('/',(request,response)=>{
    response.send('<h1>HI Shankerteja </h1>')
})

app.listen(port,()=>{
    console.log(`Server is Running At ${port}`)
})



