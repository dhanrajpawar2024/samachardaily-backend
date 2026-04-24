const axios = require('axios');

/**
 * Service endpoints mapping
 */
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  content: process.env.CONTENT_SERVICE_URL || 'http://content-service:3002',
  feed: process.env.FEED_SERVICE_URL || 'http://feed-service:3003',
  search: process.env.SEARCH_SERVICE_URL || 'http://search-service:3004',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notification-service:3005',
  recommendations: process.env.RECOMMENDATIONS_SERVICE_URL || 'http://recommendation-service:3006',
};

/**
 * Create axios client with timeout
 */
const createClient = () => {
  return axios.create({
    timeout: 10000, // 10 second timeout
    maxRedirects: 5,
  });
};

/**
 * Forward request to downstream service
 * @param {string} service - Service name (auth, content, feed, search, notifications)
 * @param {string} path - Request path (without /api/v1)
 * @param {string} method - HTTP method
 * @param {object} data - Request body
 * @param {object} headers - Request headers
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Service response
 */
const proxyRequest = async (service, path, method, data, headers, params) => {
  const baseURL = SERVICES[service];

  if (!baseURL) {
    throw new Error(`Unknown service: ${service}`);
  }

  const client = createClient();

  // Build headers for upstream request
  const upstreamHeaders = {};

  // Only set Content-Type for requests with a body
  if (data !== null && data !== undefined) {
    upstreamHeaders['Content-Type'] = 'application/json';
  }

  // Forward authorization header if present
  if (headers.authorization) {
    upstreamHeaders.authorization = headers.authorization;
  }

  // Forward custom headers
  if (headers['x-request-id']) {
    upstreamHeaders['x-request-id'] = headers['x-request-id'];
  }

  try {
    const response = await client({
      method,
      baseURL,
      url: path,
      data,
      headers: upstreamHeaders,
      params,
      validateStatus: () => true, // Don't throw on any status code
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const err = new Error(`Service ${service} is unavailable`);
      err.code = 'SERVICE_UNAVAILABLE';
      err.status = 503;
      throw err;
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      const err = new Error(`Service ${service} request timeout`);
      err.code = 'REQUEST_TIMEOUT';
      err.status = 504;
      throw err;
    }

    throw error;
  }
};

/**
 * Health check for all services
 */
const healthCheck = async () => {
  const health = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  const client = createClient();

  for (const [service, baseURL] of Object.entries(SERVICES)) {
    try {
      const response = await client.get(`${baseURL}/health`, { timeout: 5000 });
      health.services[service] = {
        status: response.status === 200 ? 'healthy' : 'degraded',
        statusCode: response.status,
      };
    } catch (error) {
      health.services[service] = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  return health;
};

module.exports = {
  SERVICES,
  proxyRequest,
  healthCheck,
};
