const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const next = require('next')
const { Kafka } = require('kafkajs');
const Queue = require('bull');
const nodemailer = require('nodemailer');
const { createClient } = require('@redis/client');

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`
});

const sendMailQueue = new Queue('email-queue', {
  redis: {
    host: process.env.BULL_REDIS_HOST || '127.0.0.1',
    port: process.env.BULL_REDIS_PORT || 6379,
    password: process.env.BULL_REDIS_PASS
  }
});

let queueSetup = false;

io.on('connection', async (socket) => {
  if ( socket && queueSetup === false ) {
    sendMailQueue.process(async (payload) => {
      const data = payload.data.content
      redisClient.set('email_sent', await sendMailQueue.getWaitingCount())
      socket.broadcast.emit('email.sent', data.content)
      // return await sendMail(payload);
    });
    queueSetup = true;
  }
})

function sendMail(payload) {
  return new Promise((resolve, reject) => {
    let mailOptions = {
      from: 'test@kafkatest.com',
      to: payload.email,
      subject: payload.subject,
      text: payload.content,
    };
    let mailConfig = {
      service: 'gmail',
      auth: {
        user: 'admin@kafkatest.com',
        pass: 'pass'
      }
    };
    nodemailer.createTransport(mailConfig).sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

nextApp.prepare().then(async () => {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: (process.env.KAFKA_BROKERS || [] ).split(',') 
  });

  const consumer = kafka.consumer({ groupId: 'emails-group' });
  
  await consumer.connect()
  await consumer.subscribe({ topic: 'emails', fromBeginning: true })
  
  await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // Use bull queue to send emails.
        sendMailQueue.add({ content: message.value.toString() }, { attempts: process.env.BULL_RETRIES || 1 });
      },
  });
  
  app.get('/messages/:chat', (req, res) => {
    res.json(messages[req.params.chat])
  })

  app.get('*', (req, res) => {
    return nextHandler(req, res)
  })

  server.listen(port, async ( err ) => {
    if (err) throw err
    await redisClient.connect();
    console.log(`> Ready on http://localhost:${port}`)
  })

  server.on('close', () => {
    consumer.disconnect();
    sendMailQueue.close();
    redisClient.disconnect();
  });
  // server.close(() => {
  //   consumer.disconnect();
  // });
})