// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import kafkaClient from '../../lib/kafka.client';

type Data = {
  success: boolean
}

type Error = {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
    try {
        if ( !req.query.emails ) {
            return res.status(400).json({ error: 'Email field invalid' });
        }
        const producer = kafkaClient.producer();
        await producer.connect()

        // NOTE: the email logic would be in github action cronjob or lambda etc. but for this test, we'd look over numbers.
        for ( let i = 1; i <= parseInt(req.query.emails.toString()); i++ ) {
            const content = 'SEND EMAIL #'  + i;
            producer.send({
                topic: 'emails',
                messages: [
                    { value: JSON.stringify({content, id: i < parseInt(req.query.emails.toString()) ? (parseInt(req.query.emails.toString()) - i).toString() : '0'})  },
                ],
            });
        }

        await producer.disconnect();
        return res.json({ success: true })
    }
    catch ( e: any ) {
        console.error(e);
        return res.status(500).json({ error: 'Server error' });    
    }
}
