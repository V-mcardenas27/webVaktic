import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const BRAND_EMAIL = import.meta.env.BRAND_EMAIL;

export const POST: APIRoute = async ({ request }) => {
  // Log para debug
  console.log('Headers:', Object.fromEntries(request.headers));
  
  if (!BRAND_EMAIL) {
    return new Response(
      JSON.stringify({ error: 'BRAND_EMAIL no configurado' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    // Detectar tipo de contenido
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      // Intentar leer como texto y parsear
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Si no es JSON, tratar como form data manual
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params);
      }
    }

    console.log('Body recibido:', body);

    const { name, email, phone, work, message } = body;

    if (!name || !email || !phone || !work || !message) {
      return new Response(
        JSON.stringify({ error: 'Completa todos los campos' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Vaktic <onboarding@resend.dev>',
      to: [BRAND_EMAIL],
      replyTo: email,
      subject: `🚀 Nueva solicitud de llamada - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Nueva solicitud</h2>
          </div>
          <div class="content">
            <div class="field"><div class="label">Nombre</div><div class="value">${name}</div></div>
            <div class="field"><div class="label">Email</div><div class="value">${email}</div></div>
            <div class="field"><div class="label">Teléfono</div><div class="value">${phone}</div></div>
            <div class="field"><div class="label">Trabajo</div><div class="value">${work}</div></div>
            <div class="field"><div class="label">Mensaje</div><div class="value">${message}</div></div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280;">
               ${new Date().toLocaleString('es-CO')}<br>
               Responder en menos de 24h
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error Resend:', error);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el correo' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en el servidor:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};