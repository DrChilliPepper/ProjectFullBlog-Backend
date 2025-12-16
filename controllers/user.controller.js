import User from "../models/user.model.js"
import Post from "../models/post.model.js"

export const getUserSavedPosts = async (req, res) => {
    const { userId: clerkUserId } = req.auth()

    if (!clerkUserId) {
        return res.status(401).json("Not authenticated")
    }

    const user = await User.findOne({ clerkUserId });

    res.status(200).json(user.savedPosts)
}
export const savePost = async (req, res) => {
    const { userId: clerkUserId } = req.auth()
    const postId = req.body.postId;

    if (!clerkUserId) {
        return res.status(401).json("Not authenticated")
    }

    const user = await User.findOne({ clerkUserId });

    const isSaved = user.savedPosts.some(p => p === postId);

    if (!isSaved) {
        await User.findByIdAndUpdate(user._id, {
            $push: { savedPosts: postId }
        })
    } else {
        await User.findByIdAndUpdate(user._id, {
            $pull: { savedPosts: postId }
        })
    }

    res.status(200).json(isSaved ? "Post unsaved" : "Post saved")
}
export const getUserSavedPostDetails = async (req, res) => {
    const { userId: clerkUserId } = req.auth()

    if (!clerkUserId) {
        return res.status(401).json("Not authenticated")
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
        return res.status(404).json("User not found")
    }

    // 🔑 Fetch actual posts using saved IDs
    const posts = await Post.find({
        _id: { $in: user.savedPosts }
    }).populate("user", "username img");

    res.status(200).json(posts)
}