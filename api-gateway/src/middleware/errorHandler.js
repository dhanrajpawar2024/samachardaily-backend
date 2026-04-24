/**
 * Standardized error response wrapper
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId;
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  console.error(`[${requestId}] Error (${statusCode}):`, {
    code: errorCode,
    message: err.message,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
  });

  // Axios error from downstream service
  if (err.response) {
    return res.status(err.response.status || 502).json({
      success: false,
      error: err.response.data?.error || 'Service error',
      code: err.response.data?.code || 'SERVICE_ERROR',
      requestId,
    });
  }

  // Network error - service unreachable
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
      requestId,
    });
  }

  // Timeout error
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
      requestId,
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: err.message,
      code: 'RATE_LIMIT_EXCEEDED',
      requestId,
    });
  }

  // Validation error
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: errors.map((e) => ({
        field: e.param,
        message: e.msg,
      })),
      requestId,
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code: errorCode,
    requestId,
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
