import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import {Playlist} from "../models/playlist.model.js"
import { request } from "express";

const isUserOwnerOfPlaylist=async(playlistId,owner)=>{
    if(!playlistId || !owner){
        throw new ApiError(400,"both fields are required")
    }
    const playlist=await Playlist.findById(playlistId)
    if(playlist.owner.toString()!==owner.toString()){
        return false;
    }
    return true
}

const createPlaylist=asyncHandler(async(req,res)=>{
    const {name,description}=req.body

    if(!name){
        throw new ApiError(400,"The name of the playlist is required")
    }

    const playlist=await Playlist.create({
        name:name,
        description:description ||"",
        videos:[],
        owner:req.user?._id
    })

    if(!playlist){
        throw new ApiError(500,"unable to create the playlist at the moment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist created successfully"))
})

const addVideoToPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params

    if(!playlistId || !videoId){
        throw new ApiError(400,"playlist id and video id is required")
    }

    const isUserOwner=await isUserOwnerOfPlaylist(playlistId,req.user._id)
    if(!isUserOwner){
        throw new ApiError("unathorised request")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    const video=await Video.findById(videoId)
    if(!video || !video.isPublished){
        throw new ApiError(400,"video not found")
    }

    if(playlist.videos.includes(videoId)){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"video already in the playlist"))
    }

    const newPlaylist = await Playlist.updateOne(
        {_id: new mongoose.Types.ObjectId(playlistId)
        },
        {$push:{videos:videoId}})

    if(!newPlaylist){
        throw new ApiError(500,"unable to add the video to the playlist at the moment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,newPlaylist,"video added successfully"))
})

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params

    if(!playlistId || !videoId){
        throw new ApiError(400,"playlist id and video id is required")
    }

    const isUserOwner=await isUserOwnerOfPlaylist(playlistId,req.user._id)
    if(!isUserOwner){
        throw new ApiError("unathorised request")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    const video=await Video.findById(videoId)
    if(!video || !video.isPublished){
        throw new ApiError(400,"video not found")
    }

    
    if(!playlist.videos.includes(videoId)){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"video is not in the playlist"))
    }

    const updatedPlaylist = await Playlist.updatOne(
        {_id:new mongoose.Types.ObjectId(playlistId)},
        {$pull:{videos:videoId}}
    ) 
    if(!updatedPlaylist){
        throw new ApiError(500,"unable to delete video from playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"video deleted from the playlist"))
})

const deletePlaylist=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!playlistId){
        throw new ApiError(400,"video id is required")
    }
    
    const isUserOwner=await isUserOwnerOfPlaylist(playlistId,req.user._id)

    if(!isUserOwner){
        throw new ApiError(400,"unathorised request")
    }

    const playlist=await Playlist.findByIdAndDelete(playlistId)

    if(!playlist){
        throw new ApiError(500,"unable to delete the playlist at the moment")
    }

    return res
    .status(200)
    .json(200,{},"playlist deleted successfully")
})

const updatePlaylist=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    const {name,description}=req.body

    if(!playlistId){
        throw new ApiError(400,"playlist id is required")
    }

    const isUserOwner=await isUserOwnerOfPlaylist(playlistId,req.user._id)

    if(!isUserOwner){
        throw new ApiError(400,"unathorised request")
    }

    const playlist=await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name,description
        }
    },{new:true})

    if(!playlist){
        throw ApiError(500,"unable to update playlist at the moment")
    }

    return res.
    status(200).
    json(new ApiResponse(200, playlist,"Playlist updated successfully"))
})

const getUserPlaylist=asyncHandler(async(req,res)=>{
    const {userId}=req.params
    if(!userId){
        throw new ApiError(400,"user id is required")
    }

    const user=await Playlist.findById(userId)
    if(!user){
        throw new ApiError(400,"User not found")
    }

    const playlist=await Playlist.aggregate([
        {
            $match:{
                owner:user?.id
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $project:{
                _id:0,
                name:1,
                description:1,
                owner:1,
                createdat:1,
                updatedat:1,
                videos:{
                    $map:{
                        input:"videoDetails",
                        as:"video",
                        in:{
                            if:{
                                $or:[
                                    { $eq: ["$$video.owner", new mongoose.Types.ObjectId(req.user._id)] },
                                    { $eq: ["$$video.isPublished", true] }
                                ]
                            },
                            then:"$$video",
                            else:null
                        }
                    }
                }
            }
        },
        {
            $set: {
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "video",
                        cond: { $ne: ["$$video", null] } 
                    }
                }
            }
        }
    ])

    if(!playlist){
        throw new ApiError("User does not have any playlist")
    }

    return res
    .status(200)
    .json(ApiResponse(200,playlist,"user playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
   
    if(!playlistId){
        throw new ApiError(400,"playlist id is required")
    }
    
    const playlist=await Playlist.aggregate([
        {
            $match:{
                owner:user?.id
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $project:{
                _id:0,
                name:1,
                description:1,
                owner:1,
                createdat:1,
                updatedat:1,
                videos:{
                    $map:{
                        input:"videoDetails",
                        as:"video",
                        in:{
                            if:{
                                $or:[
                                    { $eq: ["$$video.owner", new mongoose.Types.ObjectId(req.user._id)] },
                                    { $eq: ["$$video.isPublished", true] }
                                ]
                            },
                            then:"$$video",
                            else:null
                        }
                    }
                }
            }
        },
        {
            $set: {
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "video",
                        cond: { $ne: ["$$video", null] } 
                    }
                }
            }
        }
    ])


    if(!playlist){
        throw new ApiError(400,"playlist does not exist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist,"playlist fetched from playlist id"))
})

export{
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylist,
    getPlaylistById,
}