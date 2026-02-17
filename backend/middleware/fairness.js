const crypto = require('crypto');

const generateVoterIdentifier = (ip, userAgent) => {
  return crypto
    .createHash('sha256')
    .update(`${ip}-${userAgent}`)
    .digest('hex');
};

const generateIpHash = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    '0.0.0.0'
  );
};

module.exports = {
  generateVoterIdentifier,
  generateIpHash,
  getClientIP
};
