import { Kafka, Producer } from 'kafkajs';
import { config } from '../config';
import { logger } from '../utils/logger';

let producer: Producer | null = null;
let isConnected = false;

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  retry: { retries: 3 },
});

export const connectKafkaProducer = async (): Promise<void> => {
  try {
    producer = kafka.producer();
    await producer.connect();
    isConnected = true;
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.warn('Kafka producer connection failed, events will not be published:', error);
    isConnected = false;
  }
};

export const publishEvent = async (topic: string, event: Record<string, unknown>): Promise<void> => {
  if (!producer || !isConnected) {
    logger.warn(`Kafka not connected. Skipping event publish to topic: ${topic}`);
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: String(event.id || event.event_id || ''),
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
            source: 'venue-vendor-service',
          }),
        },
      ],
    });
    logger.info(`Event published to topic: ${topic}`);
  } catch (error) {
    logger.error(`Failed to publish event to topic ${topic}:`, error);
  }
};

export const disconnectKafkaProducer = async (): Promise<void> => {
  if (producer && isConnected) {
    await producer.disconnect();
    isConnected = false;
    logger.info('Kafka producer disconnected');
  }
};
