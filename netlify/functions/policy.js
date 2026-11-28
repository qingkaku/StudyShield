exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method Not Allowed" }) };
  }

  const profileId = process.env.NEXTDNS_PROFILE_ID;
  const apiKey = process.env.NEXTDNS_API_KEY;

  if (!profileId || !apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Missing NEXTDNS_PROFILE_ID or NEXTDNS_API_KEY in Netlify env" })
    };
  }

  try {
    const { action, domains } = JSON.parse(event.body || "{}");
    const cleanList = (domains || [])
      .map((d) => d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim())
      .filter(Boolean);

    const headers = {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json"
    };

    const baseUrl = `https://api.nextdns.io/profiles/${profileId}`;

    for (const domain of cleanList) {
      if (action === "allow") {
        await fetch(`${baseUrl}/denylist/${encodeURIComponent(domain)}`, { method: "DELETE", headers });
        await fetch(`${baseUrl}/allowlist`, {
          method: "POST",
          headers,
          body: JSON.stringify({ id: domain, active: true })
        });
      } else if (action === "block") {
        await fetch(`${baseUrl}/allowlist/${encodeURIComponent(domain)}`, { method: "DELETE", headers });
        await fetch(`${baseUrl}/denylist`, {
          method: "POST",
          headers,
          body: JSON.stringify({ id: domain, active: true })
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, action, domains: cleanList })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
