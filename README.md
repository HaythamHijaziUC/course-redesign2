# AI-Powered Course Redesign Platform

Web app for Palestine Ahliya University — Faculty of Engineering & IT. Generates a fully tailored, interactive course redesign package powered by Google Gemini AI based on user-provided Intended Learning Outcomes (ILOs).

## Architecture
- Single-page frontend (`index.html`) using HTML, CSS, and Vanilla JS.
- Vercel Serverless Function (`api/gemini.js`) acting as a secure proxy to Google Gemini API.
- **NO database, NO local API key exposure.**

## Local Development
1. Clone this repository to your local machine.
2. The frontend can be served via `npm start`:
   ```bash
   npm start
   ```
   *Note: Using `/api/gemini` natively during local development will require the `vercel dev` CLI proxy so that the Serverless functions run, OR you can test the frontend UI by mocking the responses.*

## Vercel Deployment

Deployment is 100% automated via Vercel:
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) -> **Import Project** -> Connect your repo.
3. During setup, go to **Environment Variables** and add:
   - `GEMINI_API_KEY`: Your Gemini API Key from Google AI Studio.
4. Click **Deploy**.

That's it! Your application will have a securely routed API proxy through Vercel.
