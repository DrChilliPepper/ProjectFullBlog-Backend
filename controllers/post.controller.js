import ImageKit from "imagekit";
import Post from "../models/post.model.js"
import User from "../models/user.model.js"

export const getPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;

    const query = {}

    const cat = req.query.cat
    const author = req.query.author
    const searchQuery = req.query.search
    const sortQuery = req.query.sort
    const featured = req.query.featured

    if (cat) {
        query.category = cat
    }

    if (searchQuery) {
        query.title = { $regex: searchQuery, $options: "i" }
    }
    if (author) {
        const user = await User.findOne({ username: author }).select("_id")
        if (!user) {
            return res.status(404).json("No post found!")
        }
        query.user = user._id
    }

    let sortObj = { createdAt: -1 }

    if (sortQuery) {
        switch (sortQuery) {
            case "newest":
                sortObj = { createdAt: -1 }
                break;
            case "oldest":
                sortObj = { createdAt: 1 }

                break;
            case "popular":
                sortObj = { visit: -1 }
                break;
            case "trending":
                sortObj = { visit: -1 }
                query.createdAt = {
                    $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
                }
                break;
            default:
                break;
        }
    }

    if (featured) {
        query.isFeatured = true;
    }

    const posts = await Post.find(query)
        .populate("user", "username")
        .sort(sortObj)
        .limit(limit)
        .skip((page - 1) * limit);

    const totalposts = await Post.countDocuments();
    const hasMore = page * limit < totalposts;

    res.status(200).json({ posts, hasMore });
}
export const getPost = async (req, res) => {
    const post = await Post.findOne({ slug: req.params.slug }).populate(
        "user",
        "username img"
    )
    res.status(200).json(post);
}
export const createPost = async (req, res) => {
    const { title, category, desc, content } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json("Title dalo baa")
    }
    if (!content || content.trim() === "<p><br></p>") {
        return res.status(400).json("Content daalo baa");
    }

    const { userId: clerkUserId } = req.auth();

    if (!clerkUserId) {
        return res.status(401).json("Not authorized")
    }

    const user = await User.findOne({ clerkUserId })

    if (!user) {
        return res.status(404).json("User not found")
    }

    let slug = req.body.title.replace(/ /g, "-").toLowerCase();

    let existingPost = await Post.findOne({ slug })

    let counter = 2;

    while (existingPost) {
        slug = `${slug}-${counter}`
        existingPost = await Post.findOne({ slug });
        counter++;
    }

    const newPost = new Post({ user: user._id, slug, ...req.body });

    const post = await newPost.save();
    res.status(200).json(post);
}
export const deletePost = async (req, res) => {
    const { userId: clerkUserId, sessionClaims } = req.auth();
    if (!clerkUserId) {
        return res.status(401).json("Not authorized");
    }

    const role = sessionClaims?.metadata?.role || "user"

    if (role === "admin") {
        await Post.findByIdAndDelete(req.params.id)
        return res.status(200).json("Post deleted");
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
        return res.status(404).json("User not found");
    }

    const deletedPost = await Post.findOneAndDelete({
        _id: req.params.id,
        user: user._id
    });

    if (!deletedPost) {
        return res.status(403).json("You can delete only your posts!");
    }

    return res.status(200).json("Post deleted");
};

const imagekit = new ImageKit({
    urlEndpoint: process.env.IK_URL_ENDPOINT,
    publicKey: process.env.IK_PUBLIC_KEY,
    privateKey: process.env.IK_PRIVATE_KEY,
})

export const uploadAuth = async (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result)
}
export const featurePost = async (req, res) => {
    const { userId: clerkUserId, sessionClaims } = req.auth();
    if (!clerkUserId) {
        return res.status(401).json("Not authorized");
    }
    const postId = req.body.postId

    const role = sessionClaims?.metadata?.role || "user"

    if (role !== "admin") {
        return res.status(403).json("You cannot feature posts!");
    }

    const post = await Post.findById(postId)

    if (!post) {
        return res.status(404).json("Post not found")
    }

    const isFeatured = post.isFeatured

    const updatedPost = await Post.findByIdAndUpdate(postId, { isFeatured: !isFeatured }, { new: true })

    return res.status(200).json(updatedPost);
};
export const updatePost = async (req, res) => {
    const { userId: clerkUserId, sessionClaims } = req.auth();

    if (!clerkUserId) {
        return res.status(401).json("Not authorized");
    }

    const role = sessionClaims?.metadata?.role || "user";
    const postId = req.params.id;

    const user = await User.findOne({ clerkUserId });
    if (!user) {
        return res.status(404).json("User not found");
    }

    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json("Post not found");
    }

    // only author or admin can edit
    if (post.user.toString() !== user._id.toString() && role !== "admin") {
        return res.status(403).json("You cannot edit this post");
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
            title: req.body.title,
            desc: req.body.desc,
            category: req.body.category,
            content: req.body.content,
            img: req.body.img,
        },
        { new: true }
    );

    res.status(200).json(updatedPost);
};
export const getPostById = async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
};