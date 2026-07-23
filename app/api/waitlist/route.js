function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return value.replace(/\D/g, "").length >= 10;
}

export async function POST(request) {
  let entry;

  try {
    entry = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(entry.name || "").trim();
  const email = String(entry.email || "").trim();
  const phone = String(entry.phone || "").trim();
  const website = String(entry.website || "").trim();

  if (website) {
    return json({ success: true });
  }

  if (name.length < 2 || !validEmail(email) || !validPhone(phone)) {
    return json({ error: "Please provide a valid name, email, and phone number." }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const recipientEmail = process.env.WAITLIST_RECIPIENT_EMAIL;

  if (!apiKey || !fromEmail || !recipientEmail) {
    console.error("Resend environment variables are not fully configured.");
    return json({ error: "The waitlist is temporarily unavailable." }, 503);
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        reply_to: email,
        subject: "New Langford VIP waitlist signup",
        text: [
          "A new visitor joined The Langford VIP waitlist.",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Submitted: ${new Date().toISOString()}`
        ].join("\n")
      })
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      throw new Error(`Resend returned ${resendResponse.status}: ${details}`);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Resend submission failed:", error);
    return json({ error: "We could not send your details. Please try again." }, 502);
  }
}
