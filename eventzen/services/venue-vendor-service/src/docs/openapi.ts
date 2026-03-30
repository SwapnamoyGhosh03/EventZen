export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EventZen Venue-Vendor Service API',
    version: '1.0.0',
    description: 'Venue, vendor, booking, contract and upload APIs.',
  },
  servers: [
    { url: 'http://localhost:8081', description: 'Kong Gateway (host mapped)' },
    { url: 'http://localhost:8095', description: 'Direct venue-vendor service' },
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
    { name: 'Venues' },
    { name: 'Vendors' },
    { name: 'Contracts' },
    { name: 'Uploads' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/api/v1/venues': {
      get: {
        tags: ['Venues'],
        summary: 'List venues',
        responses: { '200': { description: 'Venues list' } },
      },
      post: {
        tags: ['Venues'],
        summary: 'Create venue (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Venue created' } },
      },
    },
    '/api/v1/vendors': {
      get: {
        tags: ['Vendors'],
        summary: 'List vendors',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Vendors list' } },
      },
    },
    '/api/v1/contracts/event/{id}': {
      post: {
        tags: ['Contracts'],
        summary: 'Hire vendor for event',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Contract created' } },
      },
    },
    '/api/v1/upload': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload file',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'File uploaded' } },
      },
    },
  },
};