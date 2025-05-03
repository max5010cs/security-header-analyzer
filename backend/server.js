// backend/server.js

import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { isIP } from 'net';
import dns from 'dns/promises';
import { URL } from 'url';
import helmet from 'helmet';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(helmet());

// Helper function to validate and filter unsafe URLs
async function isValidUrl(userInput) {
  try {
    const parsed = new URL(userInput);
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) return false;

    const hostname = parsed.hostname;
    const resolved = await dns.lookup(hostname);
    const ip = resolved.address;

    const localPrefixes = ['127.', '0.', '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.2', '::1'];
    if (localPrefixes.some(prefix => ip.startsWith(prefix)) || hostname === 'localhost') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

app.post('/scan', async (req, res) => {
  const { url } = req.body;

  if (!url || !(await isValidUrl(url))) {
    return res.status(400).json({ error: 'Invalid or unsafe URL provided.' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    const headers = response.headers();
    await browser.close();

    res.json(headers);
  } catch (error) {
    console.error('Error scanning headers:', error.message);
    res.status(500).json({ error: 'Failed to fetch headers. The website might be blocking bots or there was a connection issue.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});