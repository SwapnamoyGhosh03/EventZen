db = db.getSiblingDB('eventzen_notifications');

db.notifications.createIndex({ user_id: 1, status: 1, created_at: -1 });
db.notifications.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

db.delivery_logs.createIndex({ notification_id: 1 });
db.delivery_logs.createIndex({ correlation_id: 1 }, { unique: true });
db.delivery_logs.createIndex({ sent_at: 1 });

db.notification_preferences.createIndex({ user_id: 1 }, { unique: true });

db.push_tokens.createIndex({ user_id: 1 });
db.push_tokens.createIndex({ token: 1 }, { unique: true });

db.webhook_subscriptions.createIndex({ webhook_id: 1 }, { unique: true });

print("Notification MongoDB indexes created successfully.");
