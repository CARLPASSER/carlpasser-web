const fs = require('fs');
const path = require('path');

const allowedEndpoints = new Set(['news', 'gallery']);
const defaultEndpoint = 'news';
const defaultServiceDomain = 'carlpasser';

const normalizeSegment = (value = '') => value.trim().replace(/^\/+|\/+$/g, '');

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  return envContent.split(/\r?\n/).reduce((acc, line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return acc;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    acc[key] = value;
    return acc;
  }, {});
};

const getMicroCMSConfig = () => {
  const fileEnv = loadEnvFile();

  return {
    serviceDomain: normalizeSegment(process.env.MICROCMS_SERVICE_DOMAIN || fileEnv.MICROCMS_SERVICE_DOMAIN || defaultServiceDomain),
    apiKey: process.env.MICROCMS_API_KEY || fileEnv.MICROCMS_API_KEY
  };
};

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const endpoint = normalizeSegment(query.endpoint || defaultEndpoint);

  if (!allowedEndpoints.has(endpoint)) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ message: 'Invalid endpoint.' })
    };
  }

  const { serviceDomain, apiKey } = getMicroCMSConfig();

  if (!serviceDomain || !apiKey) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ message: 'microCMS environment variables are not set.' })
    };
  }

  const apiUrl = new URL(`https://${serviceDomain}.microcms.io/api/v1/${endpoint}`);
  const passthroughParams = ['limit', 'orders', 'fields', 'offset', 'filters', 'q', 'ids'];

  passthroughParams.forEach((key) => {
    const value = query[key];

    if (typeof value === 'string' && value.length > 0) {
      apiUrl.searchParams.set(key, value);
    }
  });

  if (endpoint === 'news') {
    if (!apiUrl.searchParams.has('limit')) {
      apiUrl.searchParams.set('limit', '3');
    }

    if (!apiUrl.searchParams.has('orders')) {
      apiUrl.searchParams.set('orders', '-publishedAt');
    }
  }

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'X-MICROCMS-API-KEY': apiKey
      }
    });

    const data = await response.json();
    console.log('microCMS response:', data);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.log('Error fetching microCMS:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ message: 'Failed to fetch microCMS data.' })
    };
  }
};
