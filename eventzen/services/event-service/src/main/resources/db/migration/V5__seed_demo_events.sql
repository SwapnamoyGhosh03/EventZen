-- Demo event data for first-run Docker experience

SET @organizer_id = '22222222-2222-2222-2222-222222222222';

SET @category_technology = (
    SELECT category_id
    FROM event_categories
    WHERE category_name = 'Technology'
    LIMIT 1
);

SET @category_business = (
    SELECT category_id
    FROM event_categories
    WHERE category_name = 'Business'
    LIMIT 1
);

SET @category_education = (
    SELECT category_id
    FROM event_categories
    WHERE category_name = 'Education'
    LIMIT 1
);

INSERT INTO events (
    event_id,
    title,
    description,
    short_description,
    banner_url,
    image_urls,
    organizer_id,
    category_id,
    status,
    event_type,
    start_date,
    end_date,
    timezone,
    venue_id,
    city,
    address,
    max_capacity,
    current_registrations,
    is_recurring,
    recurrence_rule,
    is_free,
    base_price,
    currency
) VALUES
(
    '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001',
    'EventZen Product Summit 2027',
    'A flagship one-day summit for product leaders, engineering managers, founders, and growth teams. The event covers AI-native product strategy, roadmap execution, platform scaling, and GTM collaboration with practical playbooks and networking lounges.',
    'India''s practical product summit for AI, growth, and platform scale.',
    'https://picsum.photos/seed/eventzen-summit-banner/1600/900',
    '["https://picsum.photos/seed/eventzen-summit-1/1400/900","https://picsum.photos/seed/eventzen-summit-2/1400/900","https://picsum.photos/seed/eventzen-summit-3/1400/900"]',
    @organizer_id,
    @category_technology,
    'REGISTRATION_OPEN',
    'CONFERENCE',
    '2027-03-20 09:00:00',
    '2027-03-20 18:30:00',
    'Asia/Kolkata',
    'GW-MUM-1',
    'Bengaluru',
    'Silicon Valley Expo Dome, Outer Ring Road, Bengaluru',
    500,
    182,
    FALSE,
    NULL,
    FALSE,
    2499.00,
    'INR'
),
(
    '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002',
    'DesignOps & UX Systems Bootcamp',
    'A hands-on two-day workshop on design systems, accessibility, content patterns, and collaboration rituals. Teams will leave with reusable checklists, operating cadences, and governance templates for fast-moving product organizations.',
    'Two-day DesignOps workshop with system-led product delivery.',
    'https://picsum.photos/seed/eventzen-designops-banner/1600/900',
    '["https://picsum.photos/seed/eventzen-designops-1/1400/900","https://picsum.photos/seed/eventzen-designops-2/1400/900"]',
    @organizer_id,
    @category_business,
    'PUBLISHED',
    'WORKSHOP',
    '2027-04-10 10:00:00',
    '2027-04-11 17:30:00',
    'Asia/Kolkata',
    'RP-DEL-1',
    'Mumbai',
    'Gateway Grand Convention Centre, Apollo Bunder, Mumbai',
    250,
    96,
    FALSE,
    NULL,
    FALSE,
    1499.00,
    'INR'
),
(
    '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003',
    'Community Leadership Forum 2025',
    'A completed community event focused on trust-building, feedback loops, and scalable engagement programs. Includes post-event reviews, sponsor highlights, and archived session notes for new users to explore a full data-rich event lifecycle.',
    'Completed event with reviews, sponsors, and historical ticket activity.',
    'https://picsum.photos/seed/eventzen-community-banner/1600/900',
    '["https://picsum.photos/seed/eventzen-community-1/1400/900","https://picsum.photos/seed/eventzen-community-2/1400/900"]',
    @organizer_id,
    @category_education,
    'COMPLETED',
    'SEMINAR',
    '2025-11-15 09:30:00',
    '2025-11-15 17:45:00',
    'Asia/Kolkata',
    'HR-KOL-1',
    'New Delhi',
    'Rajpath Summit Hall, C Hexagon, New Delhi',
    220,
    220,
    FALSE,
    NULL,
    FALSE,
    999.00,
    'INR'
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    short_description = VALUES(short_description),
    banner_url = VALUES(banner_url),
    image_urls = VALUES(image_urls),
    organizer_id = VALUES(organizer_id),
    category_id = VALUES(category_id),
    status = VALUES(status),
    event_type = VALUES(event_type),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    timezone = VALUES(timezone),
    venue_id = VALUES(venue_id),
    city = VALUES(city),
    address = VALUES(address),
    max_capacity = VALUES(max_capacity),
    current_registrations = VALUES(current_registrations),
    is_recurring = VALUES(is_recurring),
    recurrence_rule = VALUES(recurrence_rule),
    is_free = VALUES(is_free),
    base_price = VALUES(base_price),
    currency = VALUES(currency);

INSERT INTO event_sessions (
    session_id,
    event_id,
    title,
    description,
    speaker_name,
    speaker_id,
    room,
    session_type,
    start_time,
    end_time,
    capacity,
    sort_order
) VALUES
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Opening Keynote: Building AI-First Product Teams', 'A practical keynote on leadership systems, product discovery velocity, and execution consistency.', 'Nisha Kapoor', 'spk-1001', 'Innovation Arena', 'KEYNOTE', '2027-03-20 09:30:00', '2027-03-20 10:15:00', 500, 1),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Panel: Pricing and Packaging for B2B SaaS', 'Leaders discuss monetization experiments and enterprise deal structures.', 'Arjun Menon', 'spk-1002', 'Founder Forum', 'PANEL', '2027-03-20 10:45:00', '2027-03-20 11:45:00', 350, 2),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Workshop: Product Analytics in 90 Minutes', 'Hands-on event instrumentation and funnel diagnostics workshop.', 'Ritika Sharma', 'spk-1003', 'Analytics Lab', 'WORKSHOP', '2027-03-20 14:00:00', '2027-03-20 15:30:00', 200, 3),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11004', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Founder Networking Mixer', 'Curated networking for founders, PMs, and product marketers.', 'Community Team', 'spk-1004', 'Networking Lounge', 'NETWORKING', '2027-03-20 17:15:00', '2027-03-20 18:00:00', 300, 4),

('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'Design Systems Governance 101', 'Core workshop on token strategy, UI primitives, and release governance.', 'Mihir Desai', 'spk-2001', 'Marine Ballroom', 'WORKSHOP', '2027-04-10 10:30:00', '2027-04-10 12:00:00', 180, 1),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'Accessibility by Default', 'Shipping WCAG-compliant experiences in agile product teams.', 'Farah Khan', 'spk-2002', 'Harbor Hall', 'BREAKOUT', '2027-04-10 13:15:00', '2027-04-10 14:45:00', 120, 2),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'Cross-Functional Rituals that Scale', 'How design, engineering, and product stay aligned at scale.', 'Devina Iyer', 'spk-2003', 'Capital Chamber', 'PANEL', '2027-04-11 10:00:00', '2027-04-11 11:30:00', 140, 3),

('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Community Kickoff and Metrics', 'How community programs were planned and measured through the year.', 'Rohan Batra', 'spk-3001', 'Constitution Hall', 'KEYNOTE', '2025-11-15 10:00:00', '2025-11-15 10:40:00', 220, 1),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Panel: Retention Programs that Worked', 'Panel discussion on referral loops and cohort quality.', 'Sanya Verma', 'spk-3002', 'Constitution Hall', 'PANEL', '2025-11-15 11:15:00', '2025-11-15 12:00:00', 220, 2),
('7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Community Circle & Closing Notes', 'Roundtable close-out and post-event action plans.', 'EventZen Team', 'spk-3003', 'Lounge Area', 'NETWORKING', '2025-11-15 16:00:00', '2025-11-15 17:00:00', 150, 3)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    speaker_name = VALUES(speaker_name),
    speaker_id = VALUES(speaker_id),
    room = VALUES(room),
    session_type = VALUES(session_type),
    start_time = VALUES(start_time),
    end_time = VALUES(end_time),
    capacity = VALUES(capacity),
    sort_order = VALUES(sort_order);

INSERT INTO event_agenda (
    agenda_id,
    event_id,
    session_id,
    title,
    description,
    start_time,
    end_time,
    sort_order,
    type
) VALUES
('6b9e9f21-c8a1-4e5c-a742-3346f2001001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', NULL, 'Registration & Welcome Coffee', 'Check-in counters open with networking coffee stations.', '2027-03-20 08:30:00', '2027-03-20 09:25:00', 1, 'REGISTRATION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11001', 'Opening Keynote', 'AI-first product leadership playbook.', '2027-03-20 09:30:00', '2027-03-20 10:15:00', 2, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', NULL, 'Networking Break', 'Coffee, partner stalls, and hallway networking.', '2027-03-20 10:15:00', '2027-03-20 10:40:00', 3, 'BREAK'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001004', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11002', 'Pricing & Packaging Panel', 'Hands-on examples from SaaS leaders.', '2027-03-20 10:45:00', '2027-03-20 11:45:00', 4, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001005', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', NULL, 'Lunch & Partner Expo', 'Lunch with product demo booths.', '2027-03-20 12:00:00', '2027-03-20 13:30:00', 5, 'BREAK'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001006', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11003', 'Product Analytics Workshop', 'From events to insight in under 90 minutes.', '2027-03-20 14:00:00', '2027-03-20 15:30:00', 6, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2001007', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a11004', 'Founder Networking Mixer', 'Topic-led circles and mentor tables.', '2027-03-20 17:15:00', '2027-03-20 18:00:00', 7, 'NETWORKING'),

('6b9e9f21-c8a1-4e5c-a742-3346f2002001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', NULL, 'Day 1 Check-In', 'Welcome desk and materials handout.', '2027-04-10 09:30:00', '2027-04-10 10:20:00', 1, 'REGISTRATION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2002002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12001', 'Design Systems Governance 101', 'Token architecture and release controls.', '2027-04-10 10:30:00', '2027-04-10 12:00:00', 2, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2002003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12002', 'Accessibility by Default', 'Inclusive UX patterns and release QA.', '2027-04-10 13:15:00', '2027-04-10 14:45:00', 3, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2002004', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', NULL, 'Day 2 Opening Circle', 'Recap and workshop setup.', '2027-04-11 09:30:00', '2027-04-11 09:55:00', 4, 'CUSTOM'),
('6b9e9f21-c8a1-4e5c-a742-3346f2002005', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a12003', 'Cross-Functional Rituals that Scale', 'Cadences and handoffs for fast teams.', '2027-04-11 10:00:00', '2027-04-11 11:30:00', 5, 'SESSION'),

('6b9e9f21-c8a1-4e5c-a742-3346f2003001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', NULL, 'Attendee Registration', 'Final check-in and welcome notes.', '2025-11-15 09:00:00', '2025-11-15 09:45:00', 1, 'REGISTRATION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2003002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13001', 'Community Kickoff and Metrics', 'Community health and engagement benchmarks.', '2025-11-15 10:00:00', '2025-11-15 10:40:00', 2, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2003003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13002', 'Retention Programs that Worked', 'Case studies from community operators.', '2025-11-15 11:15:00', '2025-11-15 12:00:00', 3, 'SESSION'),
('6b9e9f21-c8a1-4e5c-a742-3346f2003004', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', NULL, 'Lunch and Open Tables', 'Regional networking and feedback circles.', '2025-11-15 12:00:00', '2025-11-15 13:15:00', 4, 'BREAK'),
('6b9e9f21-c8a1-4e5c-a742-3346f2003005', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', '7a1b7d6f-8a88-4cbb-9e7b-0b90d4a13003', 'Community Circle and Closing Notes', 'Action items and post-event commitments.', '2025-11-15 16:00:00', '2025-11-15 17:00:00', 5, 'NETWORKING')
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    start_time = VALUES(start_time),
    end_time = VALUES(end_time),
    sort_order = VALUES(sort_order),
    type = VALUES(type),
    session_id = VALUES(session_id);

INSERT IGNORE INTO event_tags (id, event_id, tag_name) VALUES
('f4e0c770-16d8-4f10-90d9-58026d6a1001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'AI'),
('f4e0c770-16d8-4f10-90d9-58026d6a1002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Product'),
('f4e0c770-16d8-4f10-90d9-58026d6a1003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'SaaS'),
('f4e0c770-16d8-4f10-90d9-58026d6a1004', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001', 'Networking'),
('f4e0c770-16d8-4f10-90d9-58026d6a2001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'DesignOps'),
('f4e0c770-16d8-4f10-90d9-58026d6a2002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'UX'),
('f4e0c770-16d8-4f10-90d9-58026d6a2003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002', 'Accessibility'),
('f4e0c770-16d8-4f10-90d9-58026d6a3001', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Community'),
('f4e0c770-16d8-4f10-90d9-58026d6a3002', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Retention'),
('f4e0c770-16d8-4f10-90d9-58026d6a3003', '8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003', 'Leadership');
