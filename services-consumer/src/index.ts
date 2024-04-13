import { KafkaService } from './core/kafka/kafka.js';
import { connect, getClient } from './core/mongo/index.js';
import { RedisService } from './core/redis/redis.js';


const topic = process.env.KAFKA_TOPIC || 'create.todos';

const redisClient = new RedisService();
const kafkaService = new KafkaService();

export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inActive',
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    done: boolean;
    startDate: string;
    endDate: string;
    status: Status;
}



async function serviceConsumer(ctx: Record<string, string>, topic: string, message: string) {
    await redisClient.connect();
    const col = await getClient();
    console.log(`Received message from topic ${topic}: ${message}`);
    console.log('Context:', ctx);
    switch (topic) {
        case 'create.todos':
            const payload = JSON.parse(message) as Todo
            const topic = 'create.todos'
            const key = `${topic}::${payload.id}`

            const response = {
                id: payload.id,
                status: 'success',
                data: payload,
            }

            await col.insertOne(response)
            await redisClient.set(key, JSON.stringify(response), 10)
            break;
        case 'topic2':
            await redisClient.delete('topic1::' + ctx.session)
            break;
        default:
            console.log('Unknown topic');
    }
}

async function main() {
    await connect();
    kafkaService.createTopics(topic.split(','));
    kafkaService.consumeMessages(topic.split(','), serviceConsumer)
}

main().catch(console.error)