exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed." }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    const honeypot = String(body.website || "").trim();

    if (honeypot) {
      return { statusCode: 200, body: JSON.stringify({ message: "Thanks! Please check your inbox to confirm your subscription." }) };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ message: "Please enter a valid email address." }) };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
    if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
      console.error("Newsletter is not configured: missing BREVO_API_KEY or BREVO_NEWSLETTER_LIST_ID.");
      return { statusCode: 503, body: JSON.stringify({ message: "Newsletter subscriptions are temporarily unavailable." }) };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        email: email,
        includeListIds: [listId],
        templateId: Number(process.env.BREVO_DOUBLE_OPTIN_TEMPLATE_ID || 0),
        redirectionUrl: process.env.BREVO_CONFIRMATION_REDIRECT_URL || "https://algolassi.online/newsletter/"
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Brevo newsletter signup failed:", response.status, details);
      return { statusCode: 502, body: JSON.stringify({ message: "Unable to start your subscription. Please try again later." }) };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Thanks! Please check your inbox and confirm your subscription." })
    };
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Sorry, something went wrong. Please try again later." }) };
  }
};
