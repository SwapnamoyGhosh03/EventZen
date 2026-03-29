-- Event Categories
CREATE TABLE event_categories (
    category_id CHAR(36) NOT NULL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    color VARCHAR(7),
    description VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events
CREATE TABLE events (
    event_id CHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    banner_url VARCHAR(500),
    organizer_id CHAR(36) NOT NULL,
    category_id CHAR(36),
    status ENUM('DRAFT','PUBLISHED','REGISTRATION_OPEN','ONGOING','COMPLETED','ARCHIVED') DEFAULT 'DRAFT',
    event_type ENUM('CONFERENCE','WORKSHOP','SEMINAR','MEETUP','CONCERT','EXHIBITION','SPORTS','OTHER'),
    start_date DATETIME,
    end_date DATETIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    venue_id CHAR(36),
    city VARCHAR(100),
    address TEXT,
    max_capacity INT DEFAULT 0,
    current_registrations INT DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(255),
    is_free BOOLEAN DEFAULT TRUE,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES event_categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_start_date ON events(start_date);

-- Event Sessions
CREATE TABLE event_sessions (
    session_id CHAR(36) NOT NULL PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    speaker_name VARCHAR(200),
    speaker_id CHAR(36),
    room VARCHAR(100),
    session_type ENUM('KEYNOTE','WORKSHOP','PANEL','BREAKOUT','NETWORKING'),
    start_time DATETIME,
    end_time DATETIME,
    capacity INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_event_id ON event_sessions(event_id);

-- Event Agenda
CREATE TABLE event_agenda (
    agenda_id CHAR(36) NOT NULL PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    session_id CHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    sort_order INT DEFAULT 0,
    type ENUM('SESSION','BREAK','REGISTRATION','NETWORKING','CUSTOM') DEFAULT 'SESSION',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_agenda_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_agenda_session FOREIGN KEY (session_id) REFERENCES event_sessions(session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_agenda_event_sort ON event_agenda(event_id, sort_order);

-- Event Tags
CREATE TABLE event_tags (
    id CHAR(36) NOT NULL PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    UNIQUE KEY uk_event_tag (event_id, tag_name),
    CONSTRAINT fk_tags_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FULLTEXT INDEX ft_tag_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
