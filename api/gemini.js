export default async function handler(req, res) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") return res.status(200).end();

  // Allowed only for POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server missing API key. Please check deployment settings." });
  }

  const { systemInstruction, userMessage } = req.body;
  
  if (!systemInstruction || !userMessage) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" }
      })
    });

    if (response.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded — please wait a minute" });
    }

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Gemini API Error:", errorData);
        // We will return the actual error from Google to see what is failing
        return res.status(response.status).json({ error: `Gemini API Error: ${errorData}` });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    return res.status(200).json({ text });
  } catch (error) {
    console.error("Fetch Error:", error.message);
    return res.status(500).json({ error: "Network error — check your connection or try again." });
  }
}
