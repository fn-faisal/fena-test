// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import kafkaClient from '../../lib/kafka.client';
import { createClient } from '@redis/client';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`
});

type Data = {
  sentCount: number
}

type Error = {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
    try {
        await redisClient.connect();
        const sentCount = parseInt(await redisClient.get('email_sent') || '0');
       
        await redisClient.disconnect();
        return res.json({ sentCount })
    }
    catch ( e: any ) {
        console.error(e);
        return res.status(500).json({ error: 'Server error' });    
    }
}
