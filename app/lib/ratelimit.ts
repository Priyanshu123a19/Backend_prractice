import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';


const redis = Redis.fromEnv();


export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
  analytics: true, // Lets you see traffic charts in the Upstash dashboard!
});