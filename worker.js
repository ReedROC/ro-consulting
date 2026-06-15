/**
 * ROC Consulting — Contact Form Worker
 * Handles POST /api/contact
 * Stores submissions in D1 and sends an email notification via MailChannels
 *
 * Deploy instructions:
 *   1. Create a D1 database in Cloudflare dashboard → Workers & Pages → D1
 *      Name it: roc-contacts
 *   2. Run the SQL in schema.sql against that database (Cloudflare dashboard → D1 → your db → Console)
 *   3. Add the binding in wrangler.toml (see below)
 *   4. Deploy: npx wrangler deploy
 */

export default {
  async fetch(request, env) {
    // Only handle POST /api/contact
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/contact') {
      return new Response('Not found', { status: 404 });
    }

    // CORS headers (adjust origin if needed)
    const headers = {
      'Access-Control-Allow-Origin': 'https://roconsulting.uk',
      'Content-Type': 'application/json',
    };

    // Parse body
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
    }

    const { name, email, organisation, message } = data;

    // Basic validation
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

    // Send email notification via MailChannels (free with Cloudflare Workers)
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
      // Email failure is non-fatal — submission is already saved to D1
      console.error('MailChannels send failed:', err);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
};
