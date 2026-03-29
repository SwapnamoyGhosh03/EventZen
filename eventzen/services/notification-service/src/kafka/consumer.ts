import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config';
import { topicHandlers } from './topicHandlers';
import { sendNotification } from '../services/notification.service';
import logger from '../utils/logger';

let consumer: Consumer | null = null;

export async function startKafkaConsumer(): Promise<void> {
  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    retry: {
      initialRetryTime: 1000,
      retries: 5,
    },
  });

  consumer = kafka.consumer({ groupId: config.kafka.groupId });

  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    const topics = Object.keys(topicHandlers);
    await consumer.subscribe({ topics, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await handleMessage(payload);
      },
    });

    logger.info('Kafka consumer running', { topics });
  } catch (err) {
    logger.error('Failed to start Kafka consumer', { error: (err as Error).message });
    logger.warn('Service will continue without Kafka consumer. Retry manually.');
  }
}

/**
 * Extract the target user ID from a Kafka payload.
 * Different services use different field names; check the handler's declared
 * userIdField first, then fall back through common alternatives.
 */
function extractUserId(payload: Record<string, unknown>, userIdField: string): string | undefined {
  // Primary field as declared in the topic handler
  const primary = payload[userIdField];
  if (primary && typeof primary === 'string') return primary;

  // Fallback chain covering all services' naming conventions
  const fallbacks = ['user_id', 'userId', 'attendeeId', 'organizerId', 'vendorId'];
  for (const field of fallbacks) {
    if (field !== userIdField) {
      const val = payload[field];
      if (val && typeof val === 'string') return val;
    }
  }
  return undefined;
}

async function handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
  const handler = topicHandlers[topic];
  if (!handler) {
    logger.warn('No handler for Kafka topic', { topic });
    return;
  }

  try {
    const value = message.value?.toString();
    if (!value) {
      logger.warn('Empty Kafka message', { topic });
      return;
    }

    const payload = JSON.parse(value) as Record<string, unknown>;
    const correlationId =
      (payload.correlation_id as string | undefined) ||
      message.headers?.['correlation-id']?.toString() ||
      undefined;

    const userId = extractUserId(payload, handler.userIdField);
    if (!userId) {
      logger.warn('Cannot determine target user for Kafka message — skipping', { topic, payload });
      return;
    }

    // Resolve body — handlers can supply a static string or a dynamic function
    const body =
      typeof handler.body === 'function'
        ? handler.body(payload)
        : handler.body;

    logger.info('Processing Kafka message', { topic, correlationId, userId });

    await sendNotification({
      user_id: userId,
      title: handler.title,
      body,
      type: topic,
      channels: handler.channels,
      data: payload,
      template_key: handler.templateKey,
      template_vars: payload,
      correlation_id: correlationId,
    });

    logger.info('Kafka message processed successfully', { topic, correlationId, userId });
  } catch (err) {
    logger.error('Failed to process Kafka message', {
      topic,
      error: (err as Error).message,
    });
  }
}

export async function stopKafkaConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
}
