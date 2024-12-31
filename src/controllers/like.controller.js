import mongoose, { isValidObjectId } from "mongoose";
import {Like} from "../models/like.model.js";
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js";
import {Video} from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
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
            throw new ApiError(500,"unable to like the video")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,newLike,"video liked successfully"))
    }
    const dislike=await Like.deleteOne(likedCriteria)
    if(!dislike){
        throw new ApiError(500,"unable to dislike the video at the moment")
    }
    return res.
    status(200).
    json(new ApiResponse(200, {}, "video disliked"))
})

const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    if(!commentId){
        throw new ApiError(400,"comment id is required")
    }

    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400,"Comment not found")
    }

    const likedCriteria={
        comment:commentId,
        likedBy:req?.user._id
    }
    const alreadyliked=await Like.findOne(likedCriteria)
    if(!alreadyliked){
        const newLike=await Like.create(likedCriteria)
        if(!newLike){
            throw new ApiError(500,"unable to like the comment at the moment")
        }
        return res
        .status(200)
        .json(200,newLike,"Comment liked successfully")
    }
    const dislike=await Like.deleteOne(likedCriteria);
    if(!dislike){
        throw new ApiError(500,"unable to dislike the comment at the moment")
    }
    return res
    .status(200)
    .json(200,{},"Comment disliked succesfully")
})

const toggleTweetLike=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    if(!tweetId){
        throw new ApiError(400,"Tweet id is required")
    }

    const tweet=Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,"Tweet not found")
    }
    
    const likedCriteria={
        tweet:tweetId,
        likedBy:req?.user._id
    }

    const alreadyliked=await Like.findOne(likedCriteria)
    if(!alreadyliked){
        const newLike=await Like.create(likedCriteria)
        if(!newLike){
            throw new ApiError(500,"unable to like the tweet at the moment")
        }
        return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
    }

    const dislike=await Like.deleteOne(likedCriteria)
    if(!dislike){
        throw new ApiError(500,"unable to dislike the comment at the moment")
    }
    return res
    .status(200)
    .json(200,{},"Tweet disliked succesfully")
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    const likedVideos = Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
        },
      },
      {
        $unwind: "$likedVideos",
      },
      {
        $match: {
          "likedVideos.isPublished ": true,
        },
      },
      {
        $lookup: {
          from: "users", 
          localField: "likedVideos.owner",  
          foreignField: "_id",  
          as: "owner"  
        }
      },
      {
        $unwind: {
          path: "$owner",  
          preserveNullAndEmptyArrays: true  
        }
      },
      {
        $project: {
          id: 0,  
          username: 1,  
          avatar: 1,  
          fullName: 1  
        }
      },      
      {
        $project: {
          _id: "$likedVideos._id",
          title: "$likedVideos.title",
          thumbnail: "$likedVideos.thumbnail",
          owner: {
            username: "$owner.username",
            fullName: "$owner.fullName",
            avatar: "$owner.avatar",
          },
        },
      },
      {
        $group: {
          _id: null,
          likedVideos: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          likedVideos: 1,
        },
      },
    ]);
    if (likedVideos.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "No liked videos found"));
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "LikedVideos fetched Successfully!")
      );
  });

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}