// middleware/requestLogger.js
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Date.now() + Math.random().toString(36).substr(2, 5);
  
  // Log incoming request
  console.log(`🟢 [${requestId}] ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    body: req.method === 'POST' ? req.body : undefined
  });

  // Store original functions
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override json function
  res.json = function(body) {
    const duration = Date.now() - start;
    
    console.log(`🔵 [${requestId}] RESPONSE ${res.statusCode}`, {
      duration: `${duration}ms`,
      success: body?.success,
      dataLength: body?.data ? (Array.isArray(body.data) ? body.data.length : 1) : 0,
      error: body?.error
    });
    
    originalJson.call(this, body);
  };

  // Override send function
  res.send = function(body) {
    const duration = Date.now() - start;
    
    console.log(`🔵 [${requestId}] RESPONSE ${res.statusCode}`, {
      duration: `${duration}ms`,
      contentLength: body?.length
    });
    
    originalSend.call(this, body);
  };

  // Log errors
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.log(`🔴 [${requestId}] ERROR ${res.statusCode}`, {
        duration: `${duration}ms`
      });
    }
  });

  next();
};

module.exports = requestLogger;