---
title: "Exactly-Once Delivery in a Kafka Payment Pipeline"
description: "Guarantee no duplicates and no losses from producer through Kafka to the sink for payment events."
url: "/interview-prep/practice/system-design/scenarios/kafka-exactly-once/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 22
---

# Exactly-Once Delivery in Kafka Streaming Pipeline

**Difficulty:** Expert  
**Topics:** Streaming, Kafka, Exactly-Once Semantics, Idempotency  
**Company Tags:** Uber, Confluent, LinkedIn, Netflix

## Problem Statement

You're building a payment processing pipeline using Kafka. Each payment event must be processed exactly once - no duplicates (double charges) and no losses (missed payments).

**Design a system that guarantees exactly-once semantics:**
1. From producer to Kafka
2. Within Kafka (replication)
3. From Kafka to consumer
4. End-to-end (producer → processing → sink)

## Requirements

- Process 100K payment events/second
- Zero tolerance for duplicates (would result in double charges)
- Zero tolerance for loss (would result in missing revenue)
- Must handle consumer crashes and restarts
- Must handle Kafka broker failures

## Hints

<details>
<summary>Hint 1: The Problem with At-Least-Once</summary>
At-least-once + idempotent processing = exactly-once. But what makes processing idempotent?
</details>

<details>
<summary>Hint 2: Kafka's Built-in Features</summary>
Kafka 0.11+ has idempotent producers and transactional semantics. How do they work?
</details>

<details>
<summary>Hint 3: Consumer Side</summary>
The hardest part is the consumer. Offset commit + external write must be atomic.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

### The Exactly-Once Challenge

```
Why is exactly-once hard?

1. PRODUCER SIDE:
   Producer sends message → Broker ACKs → ACK lost → Producer retries
   Result: Duplicate message in Kafka

2. CONSUMER SIDE:
   Consumer processes message → Commits offset → Crash before DB write
   Result: Message lost (offset committed but not processed)
   
   OR:
   
   Consumer processes message → Writes to DB → Crash before offset commit
   Result: Message processed twice (on restart)
```

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXACTLY-ONCE PIPELINE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │    Payment       │         │      Kafka       │                          │
│  │    Service       │────────▶│    (Payments)    │                          │
│  │                  │         │                  │                          │
│  │  Idempotent      │         │  Transactional   │                          │
│  │  Producer        │         │  Log             │                          │
│  │  (enable.idemp)  │         │                  │                          │
│  └──────────────────┘         └────────┬─────────┘                          │
│                                        │                                    │
│                                        ▼                                    │
│                               ┌──────────────────┐                          │
│                               │  Kafka Streams   │                          │
│                               │  or Flink        │                          │
│                               │                  │                          │
│                               │  exactly_once    │                          │
│                               │  processing      │                          │
│                               └────────┬─────────┘                          │
│                                        │                                    │
│                      ┌─────────────────┼─────────────────┐                  │
│                      ▼                 ▼                 ▼                  │
│               ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│               │  Kafka   │      │ Database │      │  Kafka   │              │
│               │ (Output) │      │ (State)  │      │ (Errors) │              │
│               └──────────┘      └──────────┘      └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Level 1: Idempotent Producer

```java
// Kafka producer configuration
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("enable.idempotence", "true");  // Key setting!
props.put("acks", "all");                  // Required for idempotence
props.put("retries", Integer.MAX_VALUE);   // Retry forever
props.put("max.in.flight.requests.per.connection", 5);  // Up to 5 with idempotence

// How idempotent producer works:
// 1. Producer gets a ProducerID (PID) from broker
// 2. Each message gets a sequence number
// 3. Broker deduplicates by (PID, sequence)
// 4. Retries don't cause duplicates
```

### Level 2: Transactional Producer (for multi-partition writes)

```java
// Transactional producer configuration
props.put("transactional.id", "payment-processor-1");  // Unique per instance

KafkaProducer<String, Payment> producer = new KafkaProducer<>(props);
producer.initTransactions();

try {
    producer.beginTransaction();
    
    // All these writes are atomic
    producer.send(new ProducerRecord<>("processed-payments", payment));
    producer.send(new ProducerRecord<>("payment-audit", auditLog));
    producer.send(new ProducerRecord<>("payment-metrics", metrics));
    
    producer.commitTransaction();
} catch (Exception e) {
    producer.abortTransaction();
    throw e;
}
```

### Level 3: Exactly-Once Stream Processing (Kafka Streams)

```java
// Kafka Streams configuration
Properties props = new Properties();
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, 
          StreamsConfig.EXACTLY_ONCE_V2);  // Key setting!
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "payment-processor");

// This guarantees:
// 1. Read from input topic
// 2. Process and update state store
// 3. Write to output topic
// 4. Commit offset
// ALL happen atomically!

KStream<String, Payment> payments = builder.stream("payments");

payments
    .filter((key, payment) -> payment.isValid())
    .mapValues(this::processPayment)
    .to("processed-payments");
```

### Level 4: Consumer to External System (Hardest Part!)

When writing to an external system (database), Kafka can't provide exactly-once. You need idempotent writes.

```python
# Pattern 1: Idempotent Upsert
class PaymentConsumer:
    def process(self, message):
        payment_id = message.key
        payment = message.value
        
        # Idempotent upsert - same payment_id = same result
        self.db.execute("""
            INSERT INTO payments (payment_id, amount, status, processed_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (payment_id) DO UPDATE SET
                status = EXCLUDED.status,
                processed_at = EXCLUDED.processed_at
            WHERE payments.processed_at < EXCLUDED.processed_at
        """, (payment_id, payment.amount, 'processed', datetime.now()))

# Pattern 2: Deduplication Table
class PaymentConsumer:
    def process(self, message):
        # Check if already processed
        if self.db.exists("SELECT 1 FROM processed_offsets WHERE offset = %s", 
                         message.offset):
            return  # Skip duplicate
        
        # Process in transaction
        with self.db.transaction():
            self.process_payment(message.value)
            self.db.execute(
                "INSERT INTO processed_offsets (topic, partition, offset) VALUES (%s, %s, %s)",
                message.topic, message.partition, message.offset
            )
```

### Level 5: End-to-End Exactly-Once with Flink

```java
// Flink provides true end-to-end exactly-once with checkpointing
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);  // Checkpoint every 60s
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);

FlinkKafkaConsumer<Payment> consumer = new FlinkKafkaConsumer<>(
    "payments",
    new PaymentDeserializer(),
    kafkaProps
);
consumer.setStartFromGroupOffsets();

DataStream<Payment> payments = env.addSource(consumer);

payments
    .keyBy(Payment::getUserId)
    .process(new PaymentProcessor())
    .addSink(new JdbcSink(...));  // With exactly-once JDBC sink
```

### Summary Table

| Level | Mechanism | Guarantees |
|-------|-----------|------------|
| Producer → Kafka | Idempotent producer | No duplicates on retry |
| Multi-partition writes | Transactions | Atomic writes to multiple partitions |
| Kafka Streams | exactly_once_v2 | Atomic read-process-write |
| Consumer → DB | Idempotent writes | Dedup at sink level |
| End-to-end (Flink) | Checkpointing | Full exactly-once with external systems |

### Common Pitfalls

```
1. "I set exactly_once but still see duplicates"
   → Check if your sink is idempotent
   → Kafka only guarantees within Kafka, not external systems

2. "Performance dropped significantly"
   → Exactly-once has overhead (transactions, barriers)
   → Tune checkpoint interval and batch sizes

3. "Consumer group rebalance causes duplicates"
   → Use static group membership
   → Ensure offset commit is part of transaction

4. "Idempotent producer still causes duplicates across restarts"
   → ProducerID changes on restart
   → Use transactional.id for persistence across restarts
```

</details>

## Follow-up Questions

1. **What's the performance impact of exactly-once?** 10-30% overhead typically
2. **When is at-least-once + idempotency sufficient?** When you control the sink
3. **How do you handle exactly-once with multiple consumers?** Consumer groups + transactions

## What Interviewers Look For

1. **Understanding the problem:** Why is exactly-once hard?
2. **Layered approach:** Producer, broker, consumer each have different solutions
3. **External systems:** Knowing that Kafka can't guarantee exactly-once to external DBs
4. **Trade-offs:** Performance vs correctness
