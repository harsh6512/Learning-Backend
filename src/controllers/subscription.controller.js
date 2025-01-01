import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!channelId) {
        throw new ApiError(400, "Channel id is not found")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(400, "Channel not found")
    }

    const userId = req.user?._id
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const credentials = {
        subscriber: userId,
        channel: channelId,
    }

    const isSubscribed = await Subscription.findOne(credentials)

    if (!isSubscribed) {
        const newSubscription = await Subscription.create(credentials)

        if (!newSubscription) {
            throw new ApiError(500, "unable to subscribe the channel at the time")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, newSubscription, "Channel subscribed succesfully"))
    }

    const deleteSubscription = await Subscription.deleteOne(credentials)

    if (!deleteSubscription) {
        throw new ApiError(500, "Unable to unsubscribe the channel at the moment")
    }

    return res
        .status(200)
        .json(200, {}, "Channel nnsubscribed successfuly")
})


//this controller fetches the subscribers of a
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId}=req.params
    if(!channelId){
        throw new ApiError(400,"channel id is required")
    }

    const channel=await User.findById(channelId)
    if(!channel){
        throw new ApiError(400,"channel not found")
    }

    const channelSubscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group:{
                _id:null,
                subscribers:{$push:"subscriber"}

            }
        },
        {
            $project:{
                _id:0,
                subscribers:1
            }
        }
    ])

    if(!channelSubscribers || channelSubscribers.length==0){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"no subscribers"))
    }

    return res.
    status(200).
    json(new ApiResponse(200, channelSubscribers[0],"subscribers fetched successfully"))

})


//this controller finds out the channels the user has subscribed to
const getSubscribedChannel = asyncHandler(async (req, res) => {
    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"user id is required")
    }

    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(400,"user not found")
    }

    const subChannels=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                channels:{$push:"$channel"}
            }
        },
        {
            $project:{
                _id:0,
                channels:1
            }
        }
    ])

    if(!subChannels || subChannels.length==0){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"no subscribed channel"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,subChannels[0],"subscribed channel fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannel,
}