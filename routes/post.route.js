import express from "express"
import { getPosts, getPost, createPost, deletePost, uploadAuth, featurePost, updatePost, getPostById } from "../controllers/post.controller.js"
import increaseVisit from "../middlewares/increaseVisit.js"

const router = express.Router()

router.get("/upload-auth", uploadAuth);
router.get("/", getPosts);
router.delete("/:id", deletePost);
router.put("/:id", updatePost)
router.get("/id/:id", getPostById)
router.get("/:slug", increaseVisit, getPost);
router.post("/", createPost);
router.patch("/feature", featurePost)

export default router