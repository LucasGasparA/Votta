import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(to: string, name: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Bem-vindo ao Votta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
          <div style="width:32px;height:32px;background:#b83b3d;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:16px">⚖</span>
          </div>
          <span style="font-size:17px;font-weight:600">Votta</span>
        </div>

        <h2 style="font-size:20px;font-weight:700;margin:0 0 12px">Olá, ${name}!</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          Sua conta foi criada com sucesso. Você já pode começar a elaborar minutas legislativas com assistência jurídica por IA.
        </p>
        <p style="color:#555;line-height:1.6;margin:0 0 24px">
          Seu plano atual é o <strong>Básico</strong>, que inclui até 3 proposições por mês.
          Para acesso ilimitado e ao assistente jurídico completo, conheça o Plano Profissional.
        </p>

        <a href="${process.env.APP_URL}/planos"
           style="display:inline-block;background:#b83b3d;color:#fff;text-decoration:none;
                  padding:14px 28px;border-radius:10px;font-weight:600;font-size:14px">
          Começar agora
        </a>

        <p style="color:#aaa;font-size:12px;margin-top:28px;line-height:1.5">
          Seus dados são protegidos e armazenados no Brasil, em conformidade com a LGPD.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Redefinição de senha — Votta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
          <div style="width:32px;height:32px;background:#b83b3d;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:16px">⚖</span>
          </div>
          <span style="font-size:17px;font-weight:600">Votta</span>
        </div>

        <h2 style="font-size:20px;font-weight:700;margin:0 0 12px">Redefinição de senha</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 24px">
          Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
        </p>

        <a href="${link}"
           style="display:inline-block;background:#b83b3d;color:#fff;text-decoration:none;
                  padding:14px 28px;border-radius:10px;font-weight:600;font-size:14px">
          Redefinir minha senha
        </a>

        <p style="color:#aaa;font-size:12px;margin-top:28px;line-height:1.5">
          Se você não solicitou isso, ignore este e-mail — sua senha permanece a mesma.<br>
          Por segurança, nunca compartilhe este link.
        </p>
      </div>
    `,
  });
}
