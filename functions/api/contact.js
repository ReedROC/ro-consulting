/**
 * ROC Consulting - Contact Form Handler
 * Cloudflare Pages Function (auto-deployed from functions/ directory)
 * Handles POST /api/contact
 * Stores submissions in D1
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://roconsulting.uk',
  };

  // Parse body
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { name, email, organisation, message } = data;

  // Validation
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
  }

  // Store in D1
  try {
    await env.DB.prepare(
      `INSERT INTO enquiries (name, email, organisation, message, submitted_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(name, email, organisation || null, message, new Date().toISOString()).run();
  } catch (err) {
    console.error('D1 insert failed:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500, headers });
  }

  // Send email notification via MailChannels
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'ozretich.roc@gmail.com', name: 'Reed Ozretich' }],
        }],
        from: { email: 'noreply@roconsulting.uk', name: 'ROC Site' },
        reply_to: { email, name },
        subject: `New enquiry from ${name}`,
        content: [{
          type: 'text/plain',
          value: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Organisation: ${organisation || 'Not provided'}`,
            '',
            `Message:`,
            message,
          ].join('\n'),
        }],
      }),
    });
  } catch (err) {
    // Email failure is non-fatal - submission is saved to D1
    console.error('MailChannels send failed:', err);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://roconsulting.uk',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
