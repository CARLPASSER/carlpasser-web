const fs = require('fs');
const path = require('path');

const allowedEndpoints = new Set(['news', 'gallery']);

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
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || fileEnv.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY || fileEnv.MICROCMS_API_KEY
  };
};

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const endpoint = query.endpoint;

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

  const searchParams = new URLSearchParams(query);
  searchParams.delete('endpoint');

  const apiUrl = `https://${serviceDomain}.microcms.io/api/v1/${endpoint}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey
      }
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body
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
