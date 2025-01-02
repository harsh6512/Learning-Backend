import { Router } from "express"
import { upload } from "../middlewares/multer.middlleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos,
} from "../controllers/video.controller.js"

const router=Router()
router.use(verifyJWT)

router.route("/").get(getAllVideos).post(upload.fields([
    {name:"videoFile" , maxCount: 1},
    {
        name : "thumbnail" , maxCount:1
    }
]),publishAVideo)
router.route("/:videoId").get(getVideoById).patch(updateVideo).delete(deleteVideo)
router.route("/toggle/:videoId").patch(togglePublishStatus)

export default router