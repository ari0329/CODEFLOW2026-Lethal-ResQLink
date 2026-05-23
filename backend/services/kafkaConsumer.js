const { Kafka } = require("kafkajs");
const Alert = require("../models/Alert");
const { getIO } = require("./socketService");

const kafka = new Kafka({
  clientId: "resqlink-backend",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || "kafka:9092"],
  retry: { retries: 5, initialRetryTime: 1000 },
});

const consumer = kafka.consumer({ groupId: "resqlink-backend-group" });

async function startKafkaConsumer(io) {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_OUTPUT_TOPIC || "processed-alerts", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());

          
          if (!data.is_distress || data.is_duplicate) return;

          const alert = await Alert.create({
            source: data.source || "unknown",
            source_id: data.source_id,
            original_text: data.original_text,
            cleaned_text: data.cleaned_text,
            language: data.language || "en",
            is_distress: data.is_distress,
            confidence: data.confidence,
            emergency_type: data.emergency_type || "unknown",
            victim_count: data.entities?.victim_count,
            location: data.location,
            entities: data.entities || {},
            severity_score: data.severity_score,
            severity_level: data.severity_level,
            is_duplicate: data.is_duplicate || false,
          });

          console.log(`[Kafka] New alert saved: ${alert._id} (${data.severity_level})`);

         
          getIO()?.emit("new_alert", alert);

          
          if (data.severity_level === "CRITICAL") {
            getIO()?.emit("critical_alert", alert);
          }
        } catch (err) {
          console.error("Kafka message processing error:", err.message);
        }
      },
    });

    console.log("Kafka consumer running on topic: processed-alerts");
  } catch (err) {
    console.warn(`Kafka consumer unavailable: ${err.message}. Running without Kafka.`);
  }
}

async function publishToKafka(topic, message) {
  const producer = kafka.producer();
  try {
    await producer.connect();
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
  } catch (err) {
    console.error("Kafka publish error:", err.message);
  }
}

module.exports = { startKafkaConsumer, publishToKafka };