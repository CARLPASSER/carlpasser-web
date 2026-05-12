exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters || {};
    const id = query.id;
    const limit = query.limit || "3";
    const offset = query.offset || "0";
    const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;

    if (!serviceDomain || !apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ message: "Missing microCMS env variables" }),
      };
    }

    const endpoint = id
      ? `https://${serviceDomain}.microcms.io/api/v1/news/${encodeURIComponent(id)}`
      : `https://${serviceDomain}.microcms.io/api/v1/news?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&orders=-publishedAt`;

    const response = await fetch(
      endpoint,
      {
        headers: {
          "X-MICROCMS-API-KEY": apiKey,
        },
      }
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
