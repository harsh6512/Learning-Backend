import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const isUserOwner = async (videoId, userId) => {
    const video = await Video.findById(videoId)
    if (video?.owner.toString() == userId.toString()) {
        return true
    }
    return false
}

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title && !description) {
        throw new ApiError(400, "both title and description are required")
    }

    const videoPath = req.files?.videoFile[0]?.path;
    if (!videoPath) {
        throw new ApiError(400, "video is missing")
    }

    const thumbnailPath = req.files?.thumbnail[0]?.path
    if (!thumbnailPath) {
        throw new ApiError(400, "thumbnail is missing")
    }

    try {
        const publishedVideo = await uploadOnCloudinary(videoPath)

        if (!publishedVideo) {
            throw new ApiError(500, "Error while uploading the video file on cloudinary")
        }

        const publishedThumbnail = await uploadOnCloudinary(thumbnailPath)

        if (!publishedThumbnail) {
            throw new ApiError(500, "Error while uploading the thumbnail file to the cloudinary")
        }

        const video = await Video.create({
            videoFile: publishedVideo.url,
            thumbnail: publishedThumbnail.url,
            title: title,
            description: description,
            duration: publishedVideo.duration,
            isPublished: true,
            owner: req.user._id
        })
        if (!video) {
            throw new ApiError(500, "Error while publishing the video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "video published successfully"))
    } catch (error) {
        throw new ApiError(400, "Error while publishing the video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findById(videoId)
    if (!video || (!video.isPublished && !(video?.owner.toString() == req.user?._id.toString()))) {
        throw new ApiError(400, "video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"video fetched successfully"))
})


export {
    publishAVideo,
    getVideoById

}