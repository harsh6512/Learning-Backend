import mongoose from "mongoose"
import { Comment } from "../models/comment.model"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js";

const addComment = asyncHandler(async (req, res) => {
   const { content } = req.body
   const { videoId } = req.params

   if (!content) {
      new ApiError(400, "No comment is found")
   }

   if (!videoId) {
      new ApiError(400, "No video is found")
   }

   const video = await Video.findById(videoId)
   if (!video || (video.owner.toString() !== req.user._id.toString() && !video.isPublished)) {
      throw new ApiError("Video doesnt exist")
   }

   const comment = await Comment.create({
      content: content,
      video: videoId,
      owner: req.user._id
   })

   if (!comment) {
      throw new ApiError(500, "Something went wrong while uploading the comment")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment created sucessfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params

   if (!commentId) {
      throw new ApiError(400, "Comment id is required")
   }

   const comment = Comment.findById(commentId)
   if (!comment) {
      throw new ApiError(400, "Comment does not exist")
   }

   const videoId = new mongoose.Types.ObjectId(comment.video)
   const video = await Video.findById(videoId)
   if (!video || !video.isPublished) {
      throw new ApiError(400, "Video doesnt exist")
   }
   if (comment.owner.toString() !== req?.user._id.toString()) {
      throw new ApiError(400, "unauthorized request")
   }
   const deletedComment = await Comment.findByIdAndDelete(commentId, { new: true })
   if (!deletedComment) {
      throw new ApiError(500, "error while deleting comment")
   }
   return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"))
})

const updateComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params
   if (!commentId) {
      throw new ApiError(400, "The comment id is required")
   }

   const [content] = req.body
   if (!content) {
      throw new ApiError(400, "content is required")
   }

   const comment = await Comment.findById(commentId)

   if (!comment) {
      throw new ApiError(400, "The comment doesn't exist")
   }

   const videoId = new mongoose.Types.ObjectId(comment.video)
   const video = await Video.findById(videoId)
   if (!video || !video.isPublished) {
      throw new ApiError(400, "Video does not exist")
   }

   if (comment.owner.toString() !== req?.user._id.toString()) {
      throw new ApiError(400, "unauthorized request")
   }

   if (comment.content === content) {
      return res
         .status(200)
         .json(new ApiResponse(200, null, "No changes detected. Comment remains the same."));
   }
   
   const updatedComment = await Comment.findByIdAndUpdate(commentId, {
      $set: {
         content: content
      }
   }, { new: true })
   return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

export {
   addComment,
   deleteComment,
   updateComment,
}