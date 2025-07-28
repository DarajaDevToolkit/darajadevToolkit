export function authMailTemplate({
  title,
  message,
  name,
  code,
  expiresOn,
}: {
  title: string;
  message: string;
  name: string;
  code: string | number;
  expiresOn: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" valign="top">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 30px 0 5px 0;">
                            <img src="https://cdn.pixabay.com/photo/2017/04/03/17/24/teamwork-2198961_1280.png" alt="DarajaDevToolkit Logo" width="120" style="display: block;"/>
                        </td>
                    </tr>
                    <!-- Team Name -->
                    <tr>
                        <td align="center" style="padding: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333; border-bottom: 1px solid #eeeeee;">
                            DarajaDevToolkit Team
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 20px 40px 10px 40px; font-size: 24px; font-weight: bold; color: #333333;">
                            ${title}
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 40px 10px 40px; font-size: 16px; line-height: 1.5;">
                            Hey <strong>${name}</strong>,
                        </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                        <td style="padding: 0 40px 10px 40px; font-size: 16px; line-height: 1.5;">
                            ${message}
                        </td>
                    </tr>
                    
                    <!-- Reset Button -->
                    <tr>
                        <td style="padding: 20px 40px 10px 40px; text-align: center;">
                            <a href="#" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 16px;">
                                Reset Password
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Token Section -->
                    <tr>
                        <td style="padding: 10px 40px 20px 40px; text-align: center; font-size: 14px; color: #666666;">
                            <p>If you're not redirected, please copy this token:</p>
                            <div style="background-color: #f8f9fa; border-radius: 4px; padding: 15px; display: inline-block; margin-top: 10px;">
                                <span style="font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #333333; font-family: monospace;">
                                    ${code}
                                </span>
                            </div>
                            <p style="margin-top: 15px; color: #d32f2f; font-weight: bold;">
                                ⚠️ This token is valid for 30 minutes only
                            </p>
                            <p style="margin-top: 5px;">
                                ⌛ Expires at: <strong>${expiresOn}</strong> (UTC)
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Instructions -->
                    <tr>
                        <td style="padding: 0 40px 20px 40px; font-size: 14px; color: #666666;">
                            <p>If you didn't request this, simply ignore this email.</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; font-size: 14px; color: #999999; border-top: 1px solid #eeeeee;">
                            <p>Thank you,</p>
                            <p><strong>DarajaDevToolkit Team</strong></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}