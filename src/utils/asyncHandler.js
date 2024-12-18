const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
         Promise.resolve(requestHandler(req, res, next))
         .catch((error) => next(error))   
     }
 }
 


export {asyncHandler}


//understanding the down code 
// const asyncHandler=()=>{}
// const asyncHanlder=(func)=>{()=>{}}
// const aysncHanlder=(func)=>aysnc()=>{}



// const asyncHandler=(fn)=async(req,res,next)=>{
//   try{
//     await fn(req,res,next)
//   }catch(error){
//     res.status(err.code ||500).jason({
//         sucess:false,
//         message:err.message
//     })
//   }
// }