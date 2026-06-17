/**
 * ROC Consulting — Contact Form Pages Function
 * File location in repo: functions/api/contact.js
 *
 * Handles POST /api/contact
 * - Validates input
 * - Stores submission in D1 (binding: DB)
 * - Sends email notification via Resend (secret: RESEND_API_KEY)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', ...CORS_HEADERS };

  // ── Parse body ──
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { name, email, organisation, message } = body;

  // ── Validate required fields ──
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
  }

  // ── Store in D1 ──
  try {
    await env.DB.prepare(
      `INSERT INTO enquiries (name, email, organisation, message, submitted_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(name, email, organisation || null, message, new Date().toISOString()).run();
  } catch (err) {
    console.error('D1 insert failed:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500, headers });
  }

  // ── Send email via Resend ──
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ROC Site <noreply@roconsulting.uk>',
        to: ['ozretich.roc@gmail.com'],
        reply_to: email,
        subject: `New enquiry from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Organisation: ${organisation || 'Not provided'}`,
          '',
          'Message:',
          message,
        ].join('\n'),
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', resendRes.status, errBody);
    }
  } catch (err) {
    // Email failure is non-fatal — submission is already saved to D1
    console.error('Resend fetch failed:', err);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
