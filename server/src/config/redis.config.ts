import { Redis } from "ioredis";
let redis: Redis;
redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: "redis",
      port: 6379,
    });


export default redis;
