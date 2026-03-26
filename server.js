const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {
  console.log("No .env file found. Please create one from .env.example");
}

const PORT = 3000;

http.createServer(async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // 1. API PROXY (Replaces Vercel Serverless locally)
  if (req.url === '/api/gemini' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { systemInstruction, userMessage } = payload;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Missing or invalid GEMINI_API_KEY in .env file." }));
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const fetchRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" }
          })
        });

        const data = await fetchRes.json();
        
        if (!fetchRes.ok) {
           console.error("Gemini Error:", data);
           res.writeHead(fetchRes.status, { 'Content-Type': 'application/json' });
           return res.end(JSON.stringify({ error: `Gemini API Error: ${JSON.stringify(data)}` }));
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2. STATIC FILE SERVER (Replaces 'npx serve' locally)
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath.split('?')[0]);

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}).listen(PORT, () => {
  console.log(`\n=========================================\n`);
  console.log(`🚀 API PROXY SERVER RUNNING SUCCESSFULLY!`);
  console.log(`🔗 Go to: http://localhost:${PORT}`);
  console.log(`\n=========================================\n`);
});
