import { producer } from "./config/kafka.config.js";

export const produceMessage = async (topic: string, message: any) => {
  try {
    await producer.send({
      topic,
      messages: [{ 
        value: JSON.stringify(message),
        timestamp: Date.now().toString()
      }],
    });
    console.log(`Message produced to topic ${topic}:`, message);
  } catch (error) {
    console.error('Error producing message to Kafka:', error);
    throw error;
  }
};
