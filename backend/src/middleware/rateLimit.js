// Rate limit configs for different endpoint groups
export const demoRateLimit = {
  max: 10,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.ip,
};

export const publicRateLimit = {
  max: 50,
  timeWindow: '1 day',
  keyGenerator: (request) => request.ip,
};
