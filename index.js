import express from "express"
import connectDB from "./lib/connectDB.js"
import userRouter from "./routes/user.route.js"
import postRouter from "./routes/post.route.js"
import commentRouter from "./routes/comment.route.js"
import webhookRouter from "./routes/webhook.route.js"
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import cors from "cors"

dotenv.config();

const PORT = process.env.PORT || 5000;

console.log("CLIENT_URL = ", process.env.CLIENT_URL)
const app = express()
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))
app.use(clerkMiddleware())
app.use("/webhooks", webhookRouter)
app.use(express.json())

app.get('hello', (req, res) => {
    res.send('Hello test')
})

app.use("/users", userRouter)
app.use("/posts", postRouter)
app.use("/comments", commentRouter)

app.use((error, req, res, next) => {

    res.status(error.status || 500)

    res.json({
        message: error.message || "Something went wrong",
        status: error.status,
        stack: error.stack,
    })
})

app.listen(PORT, () => {
    connectDB()
    console.log("Server running!")
})