#!/usr/bin/env node

// ============================================================================
// Follow DevOps — Delivery Script
// ============================================================================
// Sends a digest to the user via their chosen delivery method.
// Supports: Telegram bot, Email (via Gmail SMTP), or stdout (default).
//
// Usage:
//   echo "digest text" | node deliver.js
//   node deliver.js --message "digest text"
//   node deliver.js --file /path/to/digest.txt
//
// The script reads delivery config from ~/.follow-devops/config.json
// and credentials from ~/.follow-devops/.env
//
// Delivery methods:
//   - "telegram": sends via Telegram Bot API (needs TELEGRAM_BOT_TOKEN + chat ID)
//   - "email": sends via Gmail SMTP (needs GMAIL_USER + GMAIL_APP_PASSWORD)
//   - "stdout" (default): just prints to terminal
// ============================================================================

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { config as loadEnv } from 'dotenv';

// -- Constants ---------------------------------------------------------------

const USER_DIR = join(homedir(), '.follow-devops');
const CONFIG_PATH = join(USER_DIR, 'config.json');
const ENV_PATH = join(USER_DIR, '.env');

// -- Read input --------------------------------------------------------------

// The digest text can come from stdin, --message flag, or --file flag
async function getDigestInput() {
  const args = process.argv.slice(2);

  const msgIdx = args.indexOf('--message');
  if (msgIdx !== -1 && args[msgIdx + 1]) {
    return { text: args[msgIdx + 1], isJson: false };
  }

  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    return { text: await readFile(args[fileIdx + 1], 'utf-8'), isJson: false };
  }

  const jsonIdx = args.indexOf('--json');
  if (jsonIdx !== -1 && args[jsonIdx + 1]) {
    return { text: await readFile(args[jsonIdx + 1], 'utf-8'), isJson: true };
  }

  const chunks = [];
  for await (const chunk of process.stdin) { chunks.push(chunk); }
  const text = Buffer.concat(chunks).toString('utf-8');
  // Auto-detect JSON from stdin
  const isJson = text.trimStart().startsWith('{');
  return { text, isJson };
}

// -- Telegram Delivery -------------------------------------------------------

// Sends the digest via Telegram Bot API.
// The user creates a bot via @BotFather and provides the token.
// The chat ID is obtained when the user sends their first message to the bot.
async function sendTelegram(text, botToken, chatId) {
  // Telegram has a 4096 character limit per message.
  // If the digest is longer, we split it into chunks.
  const MAX_LEN = 4000;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_LEN) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline near the limit
    let splitAt = remaining.lastIndexOf('\n', MAX_LEN);
    if (splitAt < MAX_LEN * 0.5) splitAt = MAX_LEN;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    );

    if (!res.ok) {
      const err = await res.json();
      // If Markdown parsing fails, retry without parse_mode
      if (err.description && err.description.includes("can't parse")) {
        await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: chunk,
              disable_web_page_preview: true
            })
          }
        );
      } else {
        throw new Error(`Telegram API error: ${err.description}`);
      }
    }

    // Small delay between chunks to avoid rate limiting
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 500));
  }
}

// -- HTML Delivery -----------------------------------------------------------

// Source logos (inline SVG data URIs or well-known CDN URLs)
const SOURCE_LOGOS = {
  'AWS News Blog': 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png',
  'Kubernetes Blog': 'https://kubernetes.io/images/favicon.png',
  'CNCF Blog': 'https://www.cncf.io/wp-content/uploads/2022/07/cncf-color.png',
  'Google Cloud Blog': 'https://www.gstatic.com/devrel-devsite/prod/v45f61267e5684083650f12c55b685498dbf4e8dfbccbb358f5d8e44e7b7d11c8/cloud/images/favicons/onecloud/favicon.ico',
  'Azure Blog': 'https://azurecomcdn.azureedge.net/cvt-1e1d1498e09aa1abc4ff40d23e714e1cd68e4e5b84e3d8f97e96f3b0f15de1c5/images/icon/favicon.ico',
  'LiteLLM Blog': 'https://litellm.ai/favicon.ico',
};

// Renders the digest as a rich HTML file with cards and images, opens in browser.
// Accepts either plain text (--file) or structured JSON (--json flag).
async function sendHtml(input, isJson = false) {
  const { writeFile } = await import('fs/promises');
  const { exec } = await import('child_process');

  let html;
  if (isJson) {
    html = renderJsonDigest(JSON.parse(input));
  } else {
    html = renderTextDigest(input);
  }

  const outPath = '/tmp/devops-digest.html';
  await writeFile(outPath, html, 'utf-8');
  exec(`open "${outPath}"`);
  return outPath;
}

function esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function htmlShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px 20px 64px; }
    header { border-bottom: 3px solid #0070f3; padding-bottom: 16px; margin-bottom: 32px; }
    header h1 { font-size: 1.6rem; color: #0070f3; }
    header .meta { color: #888; font-size: 0.85rem; margin-top: 4px; }
    .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 36px 0 12px; }
    /* Blog cards */
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); display: flex; flex-direction: column; }
    .card-img { width: 100%; height: 160px; object-fit: cover; background: #e8edf5; }
    .card-img-placeholder { width: 100%; height: 160px; background: linear-gradient(135deg, #e8edf5, #cdd5e0); display: flex; align-items: center; justify-content: center; }
    .card-img-placeholder img { width: 48px; height: 48px; object-fit: contain; opacity: 0.5; }
    .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .card-source { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0070f3; }
    .card-title { font-size: 0.95rem; font-weight: 600; line-height: 1.4; }
    .card-title a { color: #1a1a1a; text-decoration: none; }
    .card-title a:hover { color: #0070f3; }
    .card-summary { font-size: 0.83rem; color: #555; line-height: 1.5; flex: 1; }
    .card-date { font-size: 0.75rem; color: #aaa; }
    /* Practitioner rows */
    .practitioner { background: #fff; border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start; }
    .practitioner-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #0070f3, #00c6ff); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .practitioner-body { flex: 1; }
    .practitioner-name { font-weight: 700; font-size: 0.9rem; }
    .practitioner-role { font-size: 0.78rem; color: #888; margin-bottom: 6px; }
    .practitioner-tweet { font-size: 0.88rem; color: #333; line-height: 1.5; }
    .practitioner-link { display: inline-block; margin-top: 8px; font-size: 0.78rem; color: #0070f3; text-decoration: none; }
    .practitioner-link:hover { text-decoration: underline; }
    /* Empty state */
    .empty { color: #aaa; font-size: 0.88rem; padding: 12px 0; }
  </style>
</head>
<body>
  <div class="page">
    ${body}
  </div>
</body>
</html>`;
}

function renderJsonDigest(data) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Header
  let body = `
    <header>
      <h1>DevOps Digest</h1>
      <div class="meta">${esc(date)} &nbsp;·&nbsp; ${data.stats.blogPosts} releases &nbsp;·&nbsp; ${data.stats.xBuilders} practitioners</div>
    </header>`;

  // Blog cards
  body += `<div class="section-title">Official Releases & Blog Posts</div><div class="cards">`;
  for (const b of data.blogs) {
    const logo = SOURCE_LOGOS[b.source] || '';
    const img = b.image
      ? `<img class="card-img" src="${esc(b.image)}" alt="" onerror="this.style.display='none'">`
      : `<div class="card-img-placeholder">${logo ? `<img src="${esc(logo)}" alt="">` : ''}</div>`;
    const date = b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    body += `
      <div class="card">
        ${img}
        <div class="card-body">
          <div class="card-source">${esc(b.source)}</div>
          <div class="card-title"><a href="${esc(b.url)}" target="_blank">${esc(b.title)}</a></div>
          <div class="card-summary">${esc(b.summary)}</div>
          ${date ? `<div class="card-date">${date}</div>` : ''}
        </div>
      </div>`;
  }
  if (!data.blogs.length) body += `<p class="empty">No new posts today.</p>`;
  body += `</div>`;

  // Practitioners
  body += `<div class="section-title">Community & Practitioners</div>`;
  for (const x of data.x) {
    const initial = x.name.charAt(0).toUpperCase();
    const role = (x.bio || '').split(',')[0];
    for (const t of x.tweets) {
      body += `
        <div class="practitioner">
          <div class="practitioner-avatar">${esc(initial)}</div>
          <div class="practitioner-body">
            <div class="practitioner-name">${esc(x.name)}</div>
            <div class="practitioner-role">${esc(role)}</div>
            <div class="practitioner-tweet">${esc(t.text)}</div>
            <a class="practitioner-link" href="${esc(t.url)}" target="_blank">View on X →</a>
          </div>
        </div>`;
    }
  }
  if (!data.x.length) body += `<p class="empty">No new posts from practitioners today.</p>`;

  // Podcasts
  body += `<div class="section-title">Podcasts & Videos</div>`;
  if (data.podcasts.length) {
    for (const p of data.podcasts) {
      body += `<div class="card"><div class="card-body"><div class="card-source">${esc(p.name)}</div><div class="card-title"><a href="${esc(p.url)}" target="_blank">${esc(p.title)}</a></div></div></div>`;
    }
  } else {
    body += `<p class="empty">No new episodes this week.</p>`;
  }

  return htmlShell('DevOps Digest', body);
}

function renderTextDigest(text) {
  const body = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')
    .replace(/^## (.+)$/gm, '<h2 class="section-title">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\n{2,}/g, '</p><p style="margin:0.6rem 0">')
    .replace(/\n/g, '<br>');
  return htmlShell('DevOps Digest', `<div style="background:#fff;border-radius:10px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.08)"><p>${body}</p></div>`);
}

// -- Slack Delivery ----------------------------------------------------------

// Sends the digest via a Slack Incoming Webhook.
// Create one at: https://api.slack.com/apps → Your App → Incoming Webhooks
// No token or account beyond your existing Slack workspace needed.
async function sendSlack(text, webhookUrl) {
  // Slack blocks have a 3000 char limit per text block; split if needed
  const MAX_LEN = 2900;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_LEN) { chunks.push(remaining); break; }
    let splitAt = remaining.lastIndexOf('\n', MAX_LEN);
    if (splitAt < MAX_LEN * 0.5) splitAt = MAX_LEN;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  for (const chunk of chunks) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk })
    });
    if (!res.ok) throw new Error(`Slack webhook error: ${res.status} ${await res.text()}`);
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 300));
  }
}

// -- Email Delivery (Gmail SMTP) ---------------------------------------------

// Sends the digest via Gmail SMTP using an App Password.
// No third-party account needed — just a Google App Password.
// Setup: https://myaccount.google.com/apppasswords (requires 2-step verification)
async function sendEmail(text, gmailUser, appPassword, toEmail) {
  const { createTransport } = await import('nodemailer');
  const transporter = createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: appPassword }
  });
  await transporter.sendMail({
    from: `DevOps Digest <${gmailUser}>`,
    to: toEmail,
    subject: `DevOps Digest — ${new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}`,
    text
  });
}

// -- Main --------------------------------------------------------------------

async function main() {
  // Load env and config
  loadEnv({ path: ENV_PATH });

  let config = {};
  if (existsSync(CONFIG_PATH)) {
    config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
  }

  const delivery = config.delivery || { method: 'stdout' };
  const { text: digestText, isJson } = await getDigestInput();

  if (!digestText || digestText.trim().length === 0) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'Empty digest text' }));
    return;
  }

  try {
    switch (delivery.method) {
      case 'html': {
        const outPath = await sendHtml(digestText, isJson);
        console.log(JSON.stringify({ status: 'ok', method: 'html', message: `Digest opened in browser: ${outPath}` }));
        break;
      }

      case 'slack': {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) throw new Error('SLACK_WEBHOOK_URL not found in .env');
        await sendSlack(digestText, webhookUrl);
        console.log(JSON.stringify({ status: 'ok', method: 'slack', message: 'Digest sent to Slack' }));
        break;
      }

      case 'telegram': {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = delivery.chatId;
        if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not found in .env');
        if (!chatId) throw new Error('delivery.chatId not found in config.json');
        await sendTelegram(digestText, botToken, chatId);
        console.log(JSON.stringify({
          status: 'ok',
          method: 'telegram',
          message: 'Digest sent to Telegram'
        }));
        break;
      }

      case 'email': {
        const gmailUser = process.env.GMAIL_USER;
        const appPassword = process.env.GMAIL_APP_PASSWORD;
        const toEmail = delivery.email;
        if (!gmailUser) throw new Error('GMAIL_USER not found in .env');
        if (!appPassword) throw new Error('GMAIL_APP_PASSWORD not found in .env');
        if (!toEmail) throw new Error('delivery.email not found in config.json');
        await sendEmail(digestText, gmailUser, appPassword, toEmail);
        console.log(JSON.stringify({
          status: 'ok',
          method: 'email',
          message: `Digest sent to ${toEmail}`
        }));
        break;
      }

      case 'stdout':
      default:
        // Just print to terminal — the agent or OpenClaw handles delivery
        console.log(digestText);
        break;
    }
  } catch (err) {
    console.log(JSON.stringify({
      status: 'error',
      method: delivery.method,
      message: err.message
    }));
    process.exit(1);
  }
}

main();
