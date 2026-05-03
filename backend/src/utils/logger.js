const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const logsDir = path.resolve(__dirname, '..', '..', 'logs');
const logFile = path.join(logsDir, 'server.log');
const maxBodyLength = 2000;

const sensitiveKeys = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'secret',
  'razorpay_signature'
]);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function getRequestId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function redact(value, key = '') {
  if (value == null) return value;

  if (sensitiveKeys.has(String(key).toLowerCase())) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)])
    );
  }

  return value;
}

function truncate(value) {
  if (typeof value !== 'string') return value;
  if (value.length <= maxBodyLength) return value;
  return `${value.slice(0, maxBodyLength)}...[truncated ${value.length - maxBodyLength} chars]`;
}

function serializeError(error) {
  if (!(error instanceof Error)) {
    return redact(error);
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    status: error.status || error.statusCode
  };
}

function normalizeMeta(meta) {
  if (!meta) return undefined;
  if (meta instanceof Error) return serializeError(meta);

  try {
    return redact(meta);
  } catch {
    return '[unserializable]';
  }
}

function formatLine(level, message, meta) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === 'string' ? message : truncate(JSON.stringify(message)),
    ...(meta ? { meta: normalizeMeta(meta) } : {})
  };

  return `${JSON.stringify(payload)}\n`;
}

function writeLog(entry) {
  fs.appendFile(logFile, entry, (err) => {
    if (err) {
      process.stderr.write(`Failed to write log entry: ${err.message}\n`);
    }
  });
}

function info(message, meta) {
  writeLog(formatLine('INFO', message, meta));
}

function warn(message, meta) {
  writeLog(formatLine('WARN', message, meta));
}

function error(message, meta) {
  writeLog(formatLine('ERROR', message, meta));
}

function debug(message, meta) {
  if (process.env.NODE_ENV !== 'production') {
    writeLog(formatLine('DEBUG', message, meta));
  }
}

function getRequestMeta(req) {
  return {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    params: req.params,
    query: req.query,
    body: req.body ? truncate(JSON.stringify(redact(req.body))) : undefined,
    user: req.user ? { id: req.user.id, role: req.user.role } : undefined
  };
}

function requestMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  req.id = req.get('x-request-id') || getRequestId();
  res.setHeader('X-Request-Id', req.id);

  info('request_started', getRequestMeta(req));

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    writeLog(formatLine(level, 'request_finished', {
      ...getRequestMeta(req),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader('content-length')
    }));
  });

  next();
}

function errorMiddleware(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  error('request_error', {
    ...getRequestMeta(req),
    statusCode,
    error: serializeError(err)
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : err.message,
    requestId: req.id
  });
}

module.exports = {
  info,
  warn,
  error,
  debug,
  requestMiddleware,
  errorMiddleware,
  serializeError,
  log: info,
};
