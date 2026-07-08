exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters || {};
    const id = query.id;
    const slug = query.slug;
    const limit = query.limit || "12";
    const offset = query.offset || "0";
    const filters = query.filters;
    const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;

    if (!serviceDomain || !apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ message: "Missing microCMS env variables" }),
      };
    }

    const baseUrl = `https://${serviceDomain}.microcms.io/api/v1/blog`;
    let endpoint = "";

    if (id) {
      endpoint = `${baseUrl}/${encodeURIComponent(id)}`;
    } else {
      const params = new URLSearchParams({
        limit,
        offset,
        orders: "-publishedAt",
      });

      if (slug) {
        params.set("filters", `slug[equals]${slug}`);
      } else if (filters) {
        params.set("filters", filters);
      }

      endpoint = `${baseUrl}?${params.toString()}`;
    }

    const response = await fetch(endpoint, {
      headers: {
        "X-MICROCMS-API-KEY": apiKey,
      },
    });

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
