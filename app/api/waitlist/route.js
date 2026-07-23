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

  const endpoint = process.env.SPREADSHEET_ENDPOINT;
  if (!endpoint) {
    console.error("SPREADSHEET_ENDPOINT is not configured.");
    return json({ error: "The waitlist is temporarily unavailable." }, 503);
  }

  try {
    const spreadsheetResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        name,
        email,
        phone,
        submittedAt: new Date().toISOString()
      }),
      redirect: "follow"
    });

    if (!spreadsheetResponse.ok) {
      throw new Error(`Spreadsheet returned ${spreadsheetResponse.status}.`);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Spreadsheet submission failed:", error);
    return json({ error: "We could not save your details. Please try again." }, 502);
  }
}
