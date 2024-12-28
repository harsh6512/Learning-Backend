import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js"

/*
   example code for understanding the working of the pagination 
   app.get('/api/comments', async (req, res) => {
   const page = parseInt(req.query.page, 10) || 1; // Default to page 1
   const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
   const skip = (page - 1) * limit;

   try {
      const comments = await Comment.find().skip(skip).limit(limit);
      res.status(200).json(comments);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});
*/
const getVideoComments = asyncHandler(async (req, res) => {
   const { videoId } = req.params
   const { page = 1, limit = 1 } = req.query
   if (!videoId) {
      throw new ApiError(400, "video id is required")
   }

   const video = await Video.findById(videoId)

   if (!video) {
      throw new ApiError(404, "The video does not exist")
   }

   const commentAggregate = Comment.aggregate([
      {
         $match: {
            video: new mongoose.Types.ObjectId(videoId)
         }
      },
      {
         $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
         }
      },
      {
         $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes"
         }
      },
      {
         $addFields: {
            likesCount: {
               $size: "$likes"
            },
            owner: {
               $first: "$owner"
            },
            isLiked: {
               $cond: {
                  if: { $in: [req.user?._id, "$likes.likedBy"] },
                  then: true,
                  else: false
               }
            }
         }
      }, {
         $project: {
            content: 1,
            createdAt: 1,
            isLiked: 1,
            likesCount: 1,
            owner: {
               username: 1,
               fullName: 1,
               avatar: 1
            }
         }
      }
   ])
   const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
   }

   const comments = await Comment.aggregatePaginate(commentAggregate, options)

   if (!comments || comments.length == 0) {
      return res.status(200).json(new ApiResponse(200, {}, "No comments on this video"))
   }
   return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

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
   getVideoComments,
}