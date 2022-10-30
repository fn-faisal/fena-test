import { Kafka } from "kafkajs";
export default new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: (process.env.KAFKA_BROKERS || '').split(',') 
    // [ 'localhost:29092' ]
});