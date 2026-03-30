export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EventZen Notification Service API',
    version: '1.0.0',
    description: 'Notifications, templates, preferences, push tokens and webhooks.',
  },
  servers: [
    { url: 'http://localhost:8081', description: 'Kong Gateway (host mapped)' },
    { url: 'http://localhost:8098', description: 'Direct notification service' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    { name: 'Health' },
    { name: 'Notifications' },
    { name: 'Templates' },
    { name: 'Preferences' },
    { name: 'Push Tokens' },
    { name: 'Webhooks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/api/v1/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get current user notifications',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Notifications list' } },
      },
    },
    '/api/v1/notifications/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List templates (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Templates list' } },
      },
    },
    '/api/v1/notifications/preferences': {
      get: {
        tags: ['Preferences'],
        summary: 'Get user preferences',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Preferences response' } },
      },
    },
    '/api/v1/notifications/push-tokens': {
      post: {
        tags: ['Push Tokens'],
        summary: 'Register push token',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Token registered' } },
      },
    },
    '/api/v1/notifications/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Webhooks list' } },
      },
    },
  },
};