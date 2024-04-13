import { KafkaService } from './kafka.js';
import { RedisService } from './redis.js';


const topic = process.env.KAFKA_TOPIC || 'topic1';

const redisClient = new RedisService();
const kafkaService = new KafkaService();
kafkaService.createTopics(topic.split(','));
kafkaService.consumeMessages(topic.split(','), serviceConsumer)

async function serviceConsumer(ctx: Record<string, string>, topic: string, message: string) {
    await redisClient.connect();

    console.log(`Received message from topic ${topic}: ${message}`);
    console.log('Context:', ctx);
    switch (topic) {
        case 'topic1':
            const payload = JSON.parse(message)
            const value = {
                status: 'success',
                message: 'Data saved successfully',
                payload: payload,
            }

            await redisClient.set('topic1::' + ctx.session, JSON.stringify(value), 60)
            break;
        case 'topic2':
            await redisClient.delete('topic1::' + ctx.session)
            break;
        default:
            console.log('Unknown topic');
    }
}