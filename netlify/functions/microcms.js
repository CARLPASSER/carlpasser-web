const fs = require('fs');
const path = require('path');

const defaultServiceDomain = 'carlpasser';

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
    serviceDomain: (process.env.MICROCMS_SERVICE_DOMAIN || fileEnv.MICROCMS_SERVICE_DOMAIN || defaultServiceDomain).trim(),
    apiKey: process.env.MICROCMS_API_KEY || fileEnv.MICROCMS_API_KEY
  };
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        statusCode: 405,
        message: 'Method Not Allowed'
      })
    }
  }

  const { serviceDomain, apiKey } = getMicroCMSConfig();

  if (!serviceDomain || !apiKey) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        statusCode: 500,
        message: 'microCMS environment variables are not set.'
      })
    }
  }

  const apiUrl = `https://${serviceDomain}.microcms.io/api/v1/news?limit=3&orders=-publishedAt`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey
      }
    });

    const data = await response.json();
    console.log('microCMS response:', data);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          statusCode: response.status,
          message: data.message || 'Failed to fetch microCMS data.'
        })
      };
    }

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
      body: JSON.stringify({
        statusCode: 500,
        message: error.message || 'Failed to fetch microCMS data.'
      })
    }
  }
};
