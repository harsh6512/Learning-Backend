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

const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sorttype, userId } = req.query

    //parsing 
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)

    //validating
    page = Math.max(1, page)
    limit = Math.min(20, Math.max(1, limit))

    const pipeline = []
    if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "userId is invalid");
        }
    }

    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }
    })

    if (query) {
        pipeline.push({
            $match: {
                $text: {
                    $search: query
                }
            }
        })
    }

    const sortCriteria = {}
    if (sorttype || sortBy) {
        sortCriteria[sortBy] = sorttype === "asc" ? 1 : -1
        pipeline.push({
            $sort: sortCriteria
        })
    } else {
        sortCriteria["createdAt"] = -1
        pipeline.push({
            $sort: sortCriteria
        })
    }

    pipeline.push({
        $skip: (page - 1) * limit
    })
    pipeline.push({
        $limit: limit
    })
    const video = Video.aggregate(pipeline)
    if(!video || video.length==0){
        throw new ApiError(200,"videos are not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,video,"videos fetched successfuly"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
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
        .json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const authorized = await isUserOwner(videoId, req.user._id)
    if (!authorized) {
        throw new ApiError(400, "unauthorized request")
    }

    const { title, description } = req.body
    if (!title && !description) {
        throw new ApiError(400, "one of the field is required")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title, description
        }
    }, { new: true })
    if (!video) {
        throw new ApiError(500, "Error while updating the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    const authorized = await isUserOwner(videoId, req.user._id)
    if (!authorized) {
        throw new ApiError(400, "unauthorized request")
    }

    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(500, "Error while deleting the video")
    }

    return res
        .status(200)
        .json(200, {}, "video deleted succesfully")

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    const authorized = await isUserOwner(videoId, req.user._id)
    if (!authorized) {
        throw new ApiError(400, "Unauthorized request")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found in the database")
    }

    const newVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: !isPublished
        }
    }, {
        new: true
    })

    if (!newVideo) {
        throw new ApiError(500, "Error while toggling")
    }

    return res
        .status(200)
        .json(200, newVideo, "Video toggled successfully")
})

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos,
}