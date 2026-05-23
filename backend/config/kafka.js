const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "resqlink-backend",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || "kafka:9092"],
  retry: { 
    retries: 5, 
    initialRetryTime: 1000 
  },
});

module.exports = kafka;
