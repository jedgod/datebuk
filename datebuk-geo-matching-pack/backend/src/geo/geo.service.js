import crypto from 'crypto';
import geoip from 'geoip-lite';
import { getContinent } from './continent.js';

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded?.split(',')[0] || req.socket.remoteAddress || '').replace('::ffff:', '');
}

export function hashIp(ip) {
  return crypto.createHash('sha256').update(`${process.env.HASH_SALT || 'salt'}:${ip}`).digest('hex');
}

export function detectLocationFromRequest(req) {
  const ip = clientIp(req);
  const lookup = geoip.lookup(ip) || {};
  const countryCode = lookup.country || 'US';
  return {
    ipHash: hashIp(ip),
    country: countryCode,
    countryCode,
    continent: getContinent(countryCode),
    city: lookup.city || null,
    latitude: lookup.ll?.[0] || null,
    longitude: lookup.ll?.[1] || null,
    source: 'IP',
    precision: 'APPROXIMATE'
  };
}
