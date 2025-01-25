
const jwt=require('jsonwebtoken');


const Authonticate=async(request,response,next)=>{
    const authHeader=request.headers['authorization'];
    const token=authHeader && authHeader.split(" ")[1];

    if(!token){
        return response.status(401).json({message:'Not Found Token'});
    }
    jwt.verify(token,process.env.SECRECT_KEY,(err,payload)=>{
        if(err){
            return response.sendStatus(401);
        }
        request.user=payload;
        next()
    })


}

module.exports=Authonticate