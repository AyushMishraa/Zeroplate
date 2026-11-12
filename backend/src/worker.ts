import { pickupQueue, expiryQueue, matchingEngineQueue } from '../src/queues/queue'
import { Worker } from 'bullmq';
import { FoodModel } from '../src/models/foodModel';
import { sendNotificationMail } from '../src/services/emailServices';
import { findBestNGOsForFood } from '../src/services/matchingService';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

// Worker to handle food pickup notifications
export const pickupWorker = new Worker('pickupQueue', async(job) => {
    const { email, foodTitle } = job.data;
    console.log("Sending pickup reminder:", email);
    await sendNotificationMail(email, `Reminder: Pickup for ${foodTitle} pending...`);
},
{
    connection
}
);

export const expiryWorker = new Worker('expiryQueue', async(job) => {
    const { foodId } = job.data;
    const food = await FoodModel.findById(foodId);

    if (food) {
        console.log("Expiry Alert:", food.title);
        if (new Date(food.expirationDate).getTime() - Date.now() < 2 * 60 * 60 * 1000) {
         console.log(`⚠️ Food "${food.title}" is about to expire!`);
        }
    }
},
{
    connection
}
);

export const matchingEngineWorker = new Worker('matchingEngineQueue', async(job) => {
    const { foodId } = job.data;
    console.log("Running matching engine for food ID:", foodId);
    const rankedNGOs = await findBestNGOsForFood(foodId);
    console.log("Top matched NGOs:", rankedNGOs.slice(0, 3));
},
{
    connection
}
);

pickupWorker.on('completed', (job) => {
    console.log(`Pickup job ${job.id} has been completed`);
});

expiryWorker.on('completed', (job) => {
    console.log(`Expiry job ${job.id} has been completed`);
});

matchingEngineWorker.on('completed', (job) => {
    console.log(`Matching engine job ${job.id} has been completed`);
});

pickupWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

expiryWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

matchingEngineWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});