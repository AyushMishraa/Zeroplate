import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => {
    console.log("Connected to Redis successfully");
});

redisClient.connect();

export default redisClient;