import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import logger from '../utils/logger';

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  retry: { retries: 5 },
});

let producer: Producer;

export async function connectKafka(): Promise<void> {
  producer = kafka.producer();
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (err) {
    logger.warn('Kafka producer connection failed — running without Kafka', { error: (err as Error).message });
  }
}

export async function publishEvent(topic: string, key: string, payload: object): Promise<void> {
  if (!producer) return;
  try {
    const correlationId = uuidv4();
    await producer.send({
      topic,
      messages: [
        {
          key,
          headers: {
            'correlation-id': correlationId,
            source: 'auth-service',
            timestamp: new Date().toISOString(),
          },
          value: JSON.stringify({
            eventType: topic,
            payload,
            timestamp: new Date().toISOString(),
            source: 'auth-service',
          }),
        },
      ],
    });
    logger.debug(`Published event to ${topic}`, { correlationId, key });
  } catch (err) {
    logger.error(`Failed to publish to ${topic}`, { error: (err as Error).message });
  }
}

export async function disconnectKafka(): Promise<void> {
  if (producer) await producer.disconnect();
}
