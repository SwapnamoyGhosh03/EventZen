#!/bin/bash
echo "Waiting for Kafka to be ready..."
cub kafka-ready -b kafka:29092 1 60

echo "Creating Kafka topics..."
TOPICS=(
  "event.created"
  "event.updated"
  "event.cancelled"
  "event.published"
  "event.reminder.24h"
  "event.reminder.1h"
  "venue.booked"
  "ticket.purchased"
  "registration.confirmed"
  "registration.cancelled"
  "waitlist.promoted"
  "payment.received"
  "payment.failed"
  "budget.alert.threshold"
  "vendor.contract.signed"
  "checkin.milestone"
  "user.registered"
  "user.password.reset"
  "notification.email"
  "notification.sms"
  "notification.push"
)

for TOPIC in "${TOPICS[@]}"; do
  kafka-topics --create \
    --bootstrap-server kafka:29092 \
    --topic "$TOPIC" \
    --partitions 3 \
    --replication-factor 1 \
    --if-not-exists
  echo "Created topic: $TOPIC"
done

echo "All topics created successfully."
