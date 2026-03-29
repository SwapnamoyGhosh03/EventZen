package com.eventzen.event.config;

import org.springframework.context.annotation.Configuration;

/**
 * Elasticsearch configuration placeholder.
 * For local development, full-text search is handled via MySQL LIKE queries.
 * In production, this will be configured to connect to an Elasticsearch cluster.
 */
@Configuration
public class ElasticsearchConfig {
    // Elasticsearch integration will be enabled for production deployment.
    // Currently using MySQL LIKE-based search for local development.
}
