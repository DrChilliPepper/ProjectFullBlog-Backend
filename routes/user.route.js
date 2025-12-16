import express from "express"
import { getUserSavedPostDetails, getUserSavedPosts, savePost } from "../controllers/user.controller.js"

const router = express.Router()

router.get("/saved", getUserSavedPosts)
router.patch("/save", savePost)
router.get("/saved/posts", getUserSavedPostDetails)

export default router