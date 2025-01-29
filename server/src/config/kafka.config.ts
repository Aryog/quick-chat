import { Kafka } from 'kafkajs';
import { setTimeout } from 'timers/promises';
import prisma from "./db.config.js";

// Create Kafka instance
const kafka = new Kafka({
  clientId: 'chat-app',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Create producer and consumer instances
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chat-group' });

// Create topics function
export const createKafkaTopics = async (topic: string) => {
  const admin = kafka.admin();
  try {
    await admin.connect();
    await admin.createTopics({
      topics: [{
        topic,
        numPartitions: 1,
        replicationFactor: 1
      }]
    });
    console.log(`Topic ${topic} created successfully`);
  } finally {
    await admin.disconnect();
  }
};

// Producer function
export const produceMessage = async (topic: string, message: any) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log('Message produced successfully');
  } catch (error) {
    console.error('Error producing message:', error);
    throw error;
  }
};

// Consumer function
export const consumeMessages = async (topic: string) => {
  try {
    await consumer.subscribe({ topic: topic, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '');
          console.log({
            partition,
            offset: message.offset,
            value: data,
          });
          await prisma.chats.create({
            data: data,
          });
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error in consumer:', error);
    throw error;
  }
};

// Retry logic
const retryConnection = async (fn: () => Promise<void>, retries = 5, interval = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed. Retrying in ${interval / 1000} seconds...`);
      await setTimeout(interval);
      if (i === retries - 1) throw error;
    }
  }
};

// Initialize function
export const initializeKafka = async (topic: string) => {
  try {
    // Connect producer first
    await retryConnection(async () => {
      await producer.connect();
      console.log('Producer connected successfully');
    });

    // Create topics
    await retryConnection(async () => {
      await createKafkaTopics(topic);
      console.log('Topics created successfully');
    });

    // Connect consumer last
    await retryConnection(async () => {
      await consumer.connect();
      console.log('Consumer connected successfully');
      await consumeMessages(topic);
      console.log('Consumer started successfully');
    });

  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  }
};

// Cleanup function
export const shutdownKafka = async () => {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    console.log('Kafka connections closed');
  } catch (error) {
    console.error('Error shutting down Kafka:', error);
  }
};

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownKafka();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownKafka();
  process.exit(0);
});

export { producer, consumer };
