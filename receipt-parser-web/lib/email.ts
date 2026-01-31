import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
    try {
        const { error } = await getResendClient().emails.send({
            from: `ReceiptAI <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
            to: to,
            subject: 'Your ReceiptAI Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #8b5cf6; margin: 0;">ReceiptAI</h1>
                        <p style="color: #64748b; margin-top: 5px;">Password Reset Request</p>
                    </div>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
                        <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">
                            You requested to reset your password. Use the OTP code below to proceed:
                        </p>

                        <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6;">
                                ${otp}
                            </span>
                        </div>

                        <p style="color: #64748b; font-size: 14px;">
                            This OTP is valid for <strong>10 minutes</strong>.
                        </p>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                        </p>
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 10px;">
                            &copy; 2026 ReceiptAI Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
