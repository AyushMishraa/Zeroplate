import { Queue } from 'bullmq';
import redisConfig from '../config/redis';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

export const pickupQueue = new Queue('pickupQueue', { connection });

export const expiryQueue = new Queue('expiryQueue', { connection });

export const matchingEngineQueue = new Queue('matchingEngineQueue', { connection });
