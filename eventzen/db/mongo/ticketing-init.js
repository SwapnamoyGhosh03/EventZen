db = db.getSiblingDB('eventzen_ticketing');

db.ticket_types.createIndex({ event_id: 1 });
db.ticket_types.createIndex({ event_id: 1, type: 1 });

db.registrations.createIndex({ event_id: 1, attendee_id: 1 }, { unique: true });
db.registrations.createIndex({ idempotency_key: 1 }, { unique: true, sparse: true });

db.tickets.createIndex({ ticket_id: 1 }, { unique: true });
db.tickets.createIndex({ event_id: 1 });
db.tickets.createIndex({ attendee_id: 1 });

db.checkin_logs.createIndex({ event_id: 1 });
db.checkin_logs.createIndex({ registration_id: 1 });
db.checkin_logs.createIndex({ checkin_time: 1 }, { expireAfterSeconds: 63072000 });

db.waitlists.createIndex({ event_id: 1, position: 1 });
db.waitlists.createIndex({ event_id: 1, attendee_id: 1 }, { unique: true });

db.feedback.createIndex({ event_id: 1, attendee_id: 1 }, { unique: true });

print("Ticketing MongoDB indexes created successfully.");
