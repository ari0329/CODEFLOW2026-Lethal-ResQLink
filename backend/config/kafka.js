"use strict";
const { Kafka, CompressionTypes, logLevel } = require("kafkajs");
const logger = require("../utils/logger");

const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const kafka = new Kafka({
  clientId: "resqlink-backend",
  brokers:  BROKERS,
  logLevel: logLevel.WARN,
  retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer({ allowAutoTopicCreation: true });
let connected = false;

const TOPICS = {
  RAW_ALERTS:       "resqlink.raw_alerts",
  PROCESSED_ALERTS: "resqlink.processed_alerts",
  AUDIT_EVENTS:     "resqlink.audit_events",
};

const initKafkaProducer = async () => {
  await producer.connect();
  connected = true;
  logger.info(`Kafka producer connected → [${BROKERS.join(", ")}]`);
};

/**
 * Publish a message to a Kafka topic.
 * Silently no-ops if Kafka is not connected (graceful degradation).
 */
const publish = async (topic, message, key = null) => {
  if (!connected) return;
  try {
    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [{ key, value: JSON.stringify(message) }],
    });
  } catch (err) {
    logger.warn(`Kafka publish failed [${topic}]: ${err.message}`);
  }
};

const closeKafka = async () => {
  if (connected) await producer.disconnect();
};

module.exports = { kafka, producer, publish, TOPICS, initKafkaProducer, closeKafka };