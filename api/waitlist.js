const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, message: "Method not allowed" });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return response.status(500).json({
      success: false,
      message: "WEB3FORMS_ACCESS_KEY is not configured"
    });
  }

  const data = request.body || {};
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const phone = String(data.phone || "").trim();
  const moveInDate = String(data.moveInDate || "").trim();

  if (
    data.botcheck ||
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.replace(/\D/g, "").length < 10 ||
    !moveInDate
  ) {
    return response.status(400).json({ success: false, message: "Invalid submission" });
  }

  try {
    const web3Response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New Langford VIP Waitlist Signup",
        from_name: "The Langford Website",
        name,
        email,
        phone,
        "Ideal move-in date": moveInDate,
        "Submitted at": data.submittedAt || new Date().toISOString()
      })
    });

    const result = await web3Response.json();
    if (!web3Response.ok || !result.success) {
      return response.status(502).json({
        success: false,
        message: result.message || "Web3Forms rejected the submission"
      });
    }

    return response.status(200).json({ success: true });
  } catch {
    return response.status(502).json({
      success: false,
      message: "Unable to reach Web3Forms"
    });
  }
}
