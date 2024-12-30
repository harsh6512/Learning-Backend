import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Tweet} from "../models/tweet.model.js"

const createTweet=asyncHandler(async(req,res)=>{
    const {content}=req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const tweet=await Tweet.create({
        content:content,
        owner:req?.user._id
    })

    if(!tweet){
        throw new Error(500,"Error while uploading the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet uploaded successfully"))
})

const deleteTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    if(!tweetId){
        throw new ApiError(400, "Tweet id is requireed")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,"Tweet not found in the database")
    }

    if(tweet.owner.toString()!==req?.user._id.toString()){
        throw new ApiError(400,"Unathorised access")
    }

    const deletedTweet=await Tweet.deleteOne(tweetId)

    if(!deletedTweet){
        throw new ApiError(500,"Error while deleting the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))


})

const updateTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    if(!tweetId){
        throw new ApiError(400,"Tweet id is required")
    }

    const {content}=req.body
    if(!content){
        throw new ApiError(400,"Content is required to update the tweet")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,"Tweet is not found in the database")
    }

    if(tweet?.owner.toString() !== req?.user._id.toString()){
        throw new ApiError(400, "Invalid authorization")
    }

    if (tweet.content === content) {
        return res
           .status(200)
           .json(new ApiResponse(200, null, "No changes detected. Comment remains the same."));
     }

     const updatedTweet=await Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content:content
        }
     },{new:true})
     if(!updatedTweet){
        throw new ApiError(500,"Error while updating the tweet ")
     }

     return res
     .status(200)
     .json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"))

})

const getUserTweets=asyncHandler(async(req,res)=>{
    const {userId}=req.user._id
    if(!userId){
        throw new ApiError(400,"User id is required")
    }

    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(400,"User not found")
    }

    const tweet=Tweet.aggregate([{
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        },{
            $group:{
                _id :"owner",
                tweets:{$push:"$content"}
            }
        },{
            $project:{
                _id:0,
                tweets:1
            }
        }
    },])

    if(!tweet || tweet.length===0){
        retrun res
        .status(200)
        .json(new ApiResponse(200,{},"User has no tweets"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"User tweets feteched successfully"))

})
export {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets
}