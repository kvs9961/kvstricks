// api/send-demo.js
// Vercel Serverless Function — handles demo booking email via Resend
// Required env var: RESEND_API_KEY (set in Vercel project settings)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'saiharshakvrsr@gmail.com';
const FROM_EMAIL  = process.env.FROM_EMAIL  || 'KVSTricks <onboarding@resend.dev>';

export default async function handler(req, res) {
  // CORS headers (allow the portfolio origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from_name, from_email, from_phone, course, pref_time, message } = req.body || {};

  // Basic validation
  if (!from_name || !from_email || !from_phone || !course) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Admin notification email ──────────────────────────────────────────────
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 32px 36px; }
    .header h1 { margin: 0; font-size: 22px; color: #fff; font-weight: 700; letter-spacing: -0.3px; }
    .header p  { margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 13px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
    .body { padding: 32px 36px; }
    .row { display: flex; gap: 12px; margin-bottom: 16px; }
    .field { flex: 1; background: #1e293b; border-radius: 10px; padding: 14px 16px; }
    .field-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .field-value { font-size: 14px; color: #e2e8f0; font-weight: 500; }
    .full-field { background: #1e293b; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
    .course-tag { display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
    .footer { padding: 20px 36px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569; }
    .cta-btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="badge">📅 New Demo Request</div>
      <h1>You have a new booking!</h1>
      <p>Someone just filled out the demo request form on KVSTricks.</p>
    </div>
    <div class="body">
      <div class="row">
        <div class="field">
          <div class="field-label">👤 Name</div>
          <div class="field-value">${escapeHtml(from_name)}</div>
        </div>
        <div class="field">
          <div class="field-label">📱 Phone</div>
          <div class="field-value">${escapeHtml(from_phone)}</div>
        </div>
      </div>
      <div class="full-field">
        <div class="field-label">📧 Email</div>
        <div class="field-value">${escapeHtml(from_email)}</div>
      </div>
      <div class="row">
        <div class="field">
          <div class="field-label">📚 Course Interest</div>
          <div class="field-value"><span class="course-tag">${escapeHtml(course)}</span></div>
        </div>
        <div class="field">
          <div class="field-label">🕐 Preferred Time</div>
          <div class="field-value">${escapeHtml(pref_time || 'Anytime')}</div>
        </div>
      </div>
      ${message && message !== '—' ? `
      <div class="full-field">
        <div class="field-label">💬 Message / Goals</div>
        <div class="field-value" style="line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</div>
      </div>` : ''}
      <a href="https://wa.me/918367269961?text=Hi%20${encodeURIComponent(from_name)}%2C%20I%20saw%20your%20demo%20request%20on%20KVSTricks!" class="cta-btn">
        💬 Reply on WhatsApp
      </a>
    </div>
    <div class="footer">KVSTricks · kvstricks.com · This is an automated notification.</div>
  </div>
</body>
</html>`;

  // ── Student acknowledgement email ─────────────────────────────────────────
  const studentHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 36px; text-align: center; }
    .header .icon { font-size: 48px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; font-weight: 800; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 36px; }
    .body p { color: #94a3b8; line-height: 1.75; font-size: 14px; }
    .body p strong { color: #e2e8f0; }
    .summary-box { background: #1e293b; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #334155; }
    .summary-row:last-child { border-bottom: none; }
    .summary-key { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-val { font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .step-text { font-size: 13px; color: #94a3b8; padding-top: 6px; line-height: 1.5; }
    .wa-btn { display: block; text-align: center; margin: 28px 0 0; padding: 14px 28px; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
    .footer { padding: 20px 36px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="icon">🎉</div>
      <h1>You're All Set, ${escapeHtml(from_name.split(' ')[0])}!</h1>
      <p>Your free demo session request has been received.</p>
    </div>
    <div class="body">
      <p>Hi <strong>${escapeHtml(from_name)}</strong>,</p>
      <p>Thank you for reaching out! I've received your request for a <strong>free demo session</strong> on <strong>${escapeHtml(course)}</strong>. I'll personally review it and get back to you within <strong>24 hours</strong> to confirm your slot.</p>
      
      <div class="summary-box">
        <div class="summary-row">
          <span class="summary-key">Course</span>
          <span class="summary-val">${escapeHtml(course)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-key">Preferred Time</span>
          <span class="summary-val">${escapeHtml(pref_time || 'Anytime')}</span>
        </div>
        <div class="summary-row">
          <span class="summary-key">Phone</span>
          <span class="summary-val">${escapeHtml(from_phone)}</span>
        </div>
      </div>

      <p style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:8px;">What happens next:</p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">I'll reach out within <strong>24 hrs</strong> via WhatsApp or email to confirm your session time.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">We'll meet on <strong>Zoom</strong> — completely free, no strings attached.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">I'll build a <strong>personalised learning plan</strong> for you during the session.</div>
        </div>
      </div>

      <p>If you'd like a faster response, feel free to message me directly on WhatsApp:</p>
      <a href="https://wa.me/918367269961?text=Hi%20Harsha%20sir%2C%20I%20just%20submitted%20a%20demo%20request%20for%20${encodeURIComponent(course)}!" class="wa-btn">
        💬 Chat on WhatsApp — Fastest Reply
      </a>
    </div>
    <div class="footer">
      © 2025 KVSTricks · K V S Harsha Vardhan Reddy · Hyderabad, Telangana<br/>
      You're receiving this because you submitted a demo request at kvstricks.com
    </div>
  </div>
</body>
</html>`;

  try {
    // Send both emails concurrently
    const [adminResult, studentResult] = await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to:   [ADMIN_EMAIL],
        subject: `📅 New Demo Request — ${course} (${from_name})`,
        html: adminHtml,
        reply_to: from_email,
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to:   [from_email],
        subject: `You're booked! Your free KVSTricks demo session request`,
        html: studentHtml,
        reply_to: ADMIN_EMAIL,
      }),
    ]);

    console.log('Emails sent:', { adminResult, studentResult });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}

// Simple HTML escaping to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
