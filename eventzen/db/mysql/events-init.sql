CREATE DATABASE IF NOT EXISTS eventzen_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON eventzen_events.* TO 'event_user'@'%';
FLUSH PRIVILEGES;

USE eventzen_events;

-- Seed event categories
INSERT INTO event_categories (category_id, category_name, icon, color, sort_order) VALUES
  (UUID(), 'Conference', 'conference', '#4A90D9', 1),
  (UUID(), 'Workshop', 'workshop', '#7B68EE', 2),
  (UUID(), 'Seminar', 'seminar', '#20B2AA', 3),
  (UUID(), 'Meetup', 'meetup', '#FF6347', 4),
  (UUID(), 'Concert', 'concert', '#FF69B4', 5),
  (UUID(), 'Exhibition', 'exhibition', '#DAA520', 6),
  (UUID(), 'Sports', 'sports', '#32CD32', 7),
  (UUID(), 'Networking', 'networking', '#87CEEB', 8),
  (UUID(), 'Hackathon', 'hackathon', '#FF4500', 9),
  (UUID(), 'Gala', 'gala', '#9370DB', 10);
