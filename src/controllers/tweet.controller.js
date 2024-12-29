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