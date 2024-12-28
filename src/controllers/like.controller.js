import mongoose, { isValidObjectId } from "mongoose";
import {Like} from "../models/like.model.js";
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Video} from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params

    if(!videoId){
        throw new ApiError(400,"Video id is not found")
    }
    const video=Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found")
    }

    const likedCriteria={
        video:videoId,
        likedBy:req?.user._id
    };

    const alreadyliked=Like.findOne(likedCriteria)
    if(!alreadyliked){
        const newLike=await Like.create(likedCriteria)
        if(!newLike){
            throw new ApiError(400,"unable to like the video")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,newLike,"video liked successfully"))
    }
    const dislike=await Like.deleteOne(likedCriteria)
    if(!dislike){
        throw new ApiError(400,"unable to dislike the video at the moment")
    }
    return res.
    status(200).
    json(new ApiResponse(200, {}, "video disliked"))
})