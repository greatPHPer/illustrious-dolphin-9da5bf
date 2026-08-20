export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/newsletter-signup" && request.method === "POST") {
      return handleNewsletterSignup(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleNewsletterSignup(request, env) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const website = String(body?.website || "").trim();

    if (website) {
      return json({ message: "Thanks! Please check your inbox to confirm your subscription." });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ message: "Please enter a valid email address." }, 400);
    }

    if (!env.BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured");
      return json({ message: "Newsletter service is not configured." }, 500);
    }

    const listId = Number(env.BREVO_NEWSLETTER_LIST_ID || 7);
    const templateId = Number(env.BREVO_DOUBLE_OPTIN_TEMPLATE_ID || 14);
    const redirectionUrl = env.BREVO_CONFIRMATION_REDIRECT_URL || "https://algolassi.online/newsletter/";

    const response = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId,
        redirectionUrl,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Brevo DOI request failed", response.status, detail);

      if (response.status === 400) {
        return json({ message: "This email could not be subscribed. Please check the address and try again." }, 400);
      }

      return json({ message: "Unable to subscribe right now. Please try again later." }, 502);
    }

    return json({ message: "Thanks for subscribing! Please check your email and click the confirmation link to complete your subscription." });
  } catch (error) {
    console.error("Newsletter signup error", error);
    return json({ message: "Sorry, something went wrong. Please try again later." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}
