import dotenv from "dotenv";
import { Webhook } from "svix";
import User from "../models/user.model.js";
dotenv.config();

console.log("Webhook hit")
export const clerkWebHook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Webhook secret needed")
    }

    const payload = req.body;
    const headers = req.headers;

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;
    try {
        evt = wh.verify(payload, headers);
    } catch (err) {
        return res.status(400).json({
            message: "Webhook verification failed"
        })
    }

    console.log(evt.data)
    if (evt.type === "user.created") {
        const newUser = new User({
            clerkUserId: evt.data.id,
            username: evt.data.username || evt.data.email_addresses[0].email_address,
            email: evt.data.email_addresses[0].email_address,
            img: evt.data.profile_image_url || null
        })
        await newUser.save()
    }
    if (evt.type === "user.updated") {
        await User.findOneAndUpdate(
            { clerkUserId: evt.data.id },
            {
                username: evt.data.username || evt.data.email_addresses[0].email_address,
                email: evt.data.email_addresses[0].email_address,
                img: evt.data.profile_image_url || null
            }
        );
    }


    return res.status(200).json({
        message: "WebHook recieved",
    })
}