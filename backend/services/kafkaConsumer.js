"use strict";
const { kafka, TOPICS } = require("../config/kafka");
const Alert  = require("../models/Alert");
const logger = require("../utils/logger");

const startKafkaConsumer = async (io) => {
  const consumer = kafka.consumer({ groupId: "resqlink-backend-consumer" });

  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.PROCESSED_ALERTS], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() || "{}");
        const { alertId } = payload;
        if (!alertId) return;

        const alert = await Alert.findById(alertId).lean();
        if (!alert) return;

        // Broadcast to all connected clients
        io.emit("alert:kafka", alert);
        if (["critical","high"].includes(alert.severityLevel))
          io.to("role:responder").to("role:admin").emit("alert:urgent", alert);

        logger.debug(`[Kafka] Consumed alert: ${alertId}`);
      } catch (err) {
        logger.error(`[Kafka Consumer] Error: ${err.message}`);
      }
    },
  });

  logger.info(`Kafka consumer listening: ${TOPICS.PROCESSED_ALERTS}`);
};

module.exports = { startKafkaConsumer };