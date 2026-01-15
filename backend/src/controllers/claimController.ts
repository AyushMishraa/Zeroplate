import { Request, Response } from "express";
import { ClaimModel } from "../models/claimModel";
import { FoodModel } from "../models/foodModel"; 
import { sendNotificationMail } from "../services/emailServices";
import { io } from "../app";
import { pickupQueue } from "../queues/queue";


const createClaim = async (req: Request, res: Response) => {
    try {
        const receiverId = (req as any).user.id;
        const foodID  = req.body.foodId;

        const foodItem =  await FoodModel.findById(foodID);
        if (!foodItem || foodItem.status !== "available") {
            return res.status(404).json({message: "Food item is not available"});
        }

        const existingClaim = await ClaimModel.findOne({ food: foodID, receiver: receiverId});
        if (existingClaim) {
            return res.status(400).json({message: "You already have a claim for this food item"});
        }

        const claim = await ClaimModel.create({
            food: foodID,
            receiver: receiverId,
        });

        foodItem.status = "claimed";
        await foodItem.save();

        await sendNotificationMail(foodItem.donor.toString(), foodItem.title);

        io.emit("claimCreated", claim);
        console.log("claim", {foodID, receiverId});

        // Add a job to the pickup queue to send a reminder email after 1 hour
        pickupQueue.add('sendPickupReminder',
            { email: foodItem.donor.toString(), foodTitle: foodItem.title },
            { delay: 60 * 60 * 1000 }
        );

        return res.status(201).json({message: "Claim created successfully", claim});
    } catch (error: any) {
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}

const getClaims = async(req:Request, res:Response) => {
    try {
         const receiverId = (req as any).user.id;
         const claims = await ClaimModel.find({receiver: receiverId}).populate("food").populate("receiver", "name email");
         res.status(200).json({success: true, claims});
    } catch (error: any) {
        res.status(500).json({success: false, message: "Internal server error", error: error.message});
    }
}

export { createClaim, getClaims };

