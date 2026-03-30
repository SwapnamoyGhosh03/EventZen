export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EventZen Auth Service API',
    version: '1.0.0',
    description: 'Authentication, profile, user admin, and account request APIs.',
  },
  servers: [
    { url: 'http://localhost:8081', description: 'Kong Gateway (host mapped)' },
    { url: 'http://localhost:8093', description: 'Direct auth service' },
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
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Account Requests' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        responses: { '201': { description: 'User registered' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        responses: { '200': { description: 'Login successful' } },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Profile response' } },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Users list' } },
      },
    },
    '/api/v1/account-requests': {
      post: {
        tags: ['Account Requests'],
        summary: 'Create account request',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Request created' } },
      },
    },
  },
};