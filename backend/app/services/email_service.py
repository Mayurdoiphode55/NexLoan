import logging
import httpx
from typing import Optional

from app.config import settings

logger = logging.getLogger("nexloan.email")

# Shared HTTP client for efficiency
_http_client: Optional[httpx.AsyncClient] = None


async def _get_client() -> httpx.AsyncClient:
    """Get or create a shared httpx AsyncClient."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=30.0)
    return _http_client


async def send_otp_email(email: str, otp: str, full_name: str) -> bool:
    """
    Send an OTP verification email via Brevo API.
    """
    try:
        html_content = _otp_email_template(full_name, otp)
        return await _send_brevo_api_email(
            to_email=email,
            to_name=full_name,
            subject="Your NexLoan OTP Verification Code",
            html_content=html_content
        )
    except Exception as e:
        logger.error(f"❌ Failed to send OTP email to {email}: {e}")
        return False


async def send_approval_email(
    email: str,
    full_name: str,
    loan_number: str,
    loan_amount: float,
    interest_rate: float,
    emi_amount: float,
    tenure_months: int,
) -> bool:
    """
    Send a loan approval email via Brevo API.
    """
    try:
        html_content = _approval_email_template(
            full_name, loan_number, loan_amount, interest_rate, emi_amount, tenure_months
        )
        return await _send_brevo_api_email(
            to_email=email,
            to_name=full_name,
            subject=f"🎉 Your Loan {loan_number} is Approved!",
            html_content=html_content
        )
    except Exception as e:
        logger.error(f"❌ Failed to send approval email to {email}: {e}")
        return False


async def send_rejection_email(
    email: str, full_name: str, loan_number: str, reason: str
) -> bool:
    """
    Send a loan rejection email via Brevo API.
    """
    try:
        html_content = _rejection_email_template(full_name, loan_number, reason)
        return await _send_brevo_api_email(
            to_email=email,
            to_name=full_name,
            subject=f"Update on Your Loan Application {loan_number}",
            html_content=html_content
        )
    except Exception as e:
        logger.error(f"❌ Failed to send rejection email to {email}: {e}")
        return False


async def send_no_dues_certificate(
    email: str, full_name: str, loan_number: str, loan_amount: float, total_paid: float
) -> bool:
    """
    Send a no-dues certificate email via Brevo API.
    """
    try:
        html_content = _no_dues_certificate_template(full_name, loan_number, loan_amount, total_paid)
        return await _send_brevo_api_email(
            to_email=email,
            to_name=full_name,
            subject=f"Your NexLoan No-Dues Certificate - {loan_number}",
            html_content=html_content
        )
    except Exception as e:
        logger.error(f"❌ Failed to send no-dues certificate to {email}: {e}")
        return False


# ─── Brevo API Helper ─────────────────────────────────────────────────────────


async def _send_brevo_api_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """
    Send email via Brevo REST API (HTTPS Port 443).
    This is much more reliable than SMTP on cloud platforms like Render.
    """
    try:
        # Resolve API Key (fallback to SMTP_PASSWORD if BREVO_API_KEY is not set)
        api_key = settings.BREVO_API_KEY or settings.SMTP_PASSWORD
        
        if not api_key:
            logger.error("❌ Brevo API Key is missing. Please set BREVO_API_KEY or SMTP_PASSWORD.")
            return False

        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "sender": {
                "name": settings.APP_NAME,
                "email": settings.EMAIL_FROM
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_name
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }

        client = await _get_client()
        logger.info(f"📧 Sending Brevo API email to {to_email}...")
        
        response = await client.post(url, json=payload, headers=headers)
        
        if response.status_code in [201, 200, 202]:
            logger.info(f"✅ API Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"❌ Brevo API Error ({response.status_code}): {response.text}")
            if response.status_code == 401:
                logger.error("💡 Hint: Your Brevo API Key is invalid or expired.")
            elif response.status_code == 400:
                logger.error("💡 Hint: Malformed request or unverified sender email.")
            return False
            
    except Exception as e:
        logger.error(f"❌ Exception sending Brevo API email: {e}")
        return False





def _otp_email_template(full_name: str, otp: str) -> str:
    """HTML template for OTP verification email."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }}
            .otp-box {{ background: white; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
            .otp {{ font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #2563eb; font-family: 'Courier New', monospace; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 NexLoan Verification</h1>
                <p>Your OTP verification code is ready</p>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                <p>Thank you for signing up with <strong>NexLoan</strong>! Here's your One-Time Password (OTP) for verification:</p>
                
                <div class="otp-box">
                    <div class="otp">{otp}</div>
                </div>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This code expires in <strong>5 minutes</strong></li>
                    <li>Never share this code with anyone</li>
                    <li>NexLoan staff will never ask for your OTP</li>
                </ul>
                
                <p>If you did not request this code, please ignore this email.</p>
                
                <p>Happy lending with NexLoan! 🚀</p>
                
                <div class="footer">
                    <p>© 2024 NexLoan — Powered by Theoremlabs. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


def _approval_email_template(
    full_name: str,
    loan_number: str,
    loan_amount: float,
    interest_rate: float,
    emi_amount: float,
    tenure_months: int,
) -> str:
    """HTML template for loan approval email."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px 20px; }}
            .footer {{ background: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }}
            .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .detail-label {{ font-weight: 600; color: #666; }}
            .detail-value {{ color: #2563eb; font-weight: 600; }}
            .btn {{ background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations!</h1>
                <p>Your Loan Application is Approved</p>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                <p>Great news! Your loan application has been <strong>APPROVED</strong> by our underwriting team.</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Loan Number:</span>
                        <span class="detail-value">{loan_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Loan Amount:</span>
                        <span class="detail-value">₹{loan_amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Interest Rate:</span>
                        <span class="detail-value">{interest_rate}% p.a.</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Monthly EMI:</span>
                        <span class="detail-value">₹{emi_amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tenure:</span>
                        <span class="detail-value">{tenure_months} months</span>
                    </div>
                </div>
                
                <p><strong>What's next?</strong></p>
                <ol>
                    <li>Log in to your NexLoan dashboard</li>
                    <li>Review your loan details and EMI schedule</li>
                    <li>Accept the loan terms</li>
                    <li>Funds will be disbursed to your account</li>
                </ol>
                
                <p>If you have any questions, our support team is here to help.</p>
                
                <div style="text-align: center;">
                    <a href="https://nexloan.app/dashboard" class="btn">View Loan Details</a>
                </div>
                
                <p style="margin-top: 20px;">Best regards,<br><strong>NexLoan Team</strong></p>
            </div>
            <div class="footer">
                <p>© 2024 NexLoan — Powered by Theoremlabs. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def _rejection_email_template(
    full_name: str, loan_number: str, reason: str
) -> str:
    """HTML template for loan rejection email."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #f97316; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }}
            .reason-box {{ background: #fef2f2; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Loan Application Status</h1>
                <p>Update on your application</p>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                <p>Thank you for applying for a loan with NexLoan. We appreciate your interest.</p>
                
                <p>Unfortunately, your loan application <strong>({loan_number})</strong> could not be approved at this time.</p>
                
                <div class="reason-box">
                    <p><strong>Reason:</strong></p>
                    <p>{reason}</p>
                </div>
                
                <p><strong>What can you do?</strong></p>
                <ul>
                    <li>Improve your financial profile: increase savings, reduce existing EMI obligations</li>
                    <li>Try again after 30 days with updated financial information</li>
                    <li>Contact our support team for personalized guidance</li>
                </ul>
                
                <p>We're here to help! Feel free to reach out if you'd like to discuss your application further.</p>
                
                <p style="margin-top: 20px;">Best regards,<br><strong>NexLoan Team</strong></p>
                
                <div class="footer">
                    <p>© 2024 NexLoan — Powered by Theoremlabs. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


def _no_dues_certificate_template(
    full_name: str, loan_number: str, original_amount: float, total_paid: float
) -> str:
    """HTML template for no-dues certificate."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Georgia', serif; line-height: 1.8; color: #333; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
            .certificate {{ border: 3px solid #2563eb; padding: 50px; text-align: center; background: #f0f4f8; border-radius: 8px; }}
            .title {{ font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }}
            .subtitle {{ font-size: 14px; color: #666; margin-bottom: 30px; }}
            .content {{ margin: 40px 0; text-align: left; }}
            .detail-row {{ display: flex; justify-content: space-between; margin: 15px 0; padding: 10px 0; border-bottom: 1px dotted #ccc; }}
            .detail-label {{ font-weight: 600; }}
            .detail-value {{ text-align: right; }}
            .seal {{ margin-top: 40px; text-align: center; font-size: 48px; }}
            .signature {{ margin-top: 40px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="certificate">
                <div class="title">✅ NO-DUES CERTIFICATE</div>
                <div class="subtitle">Loan Successfully Closed</div>
                
                <div class="content">
                    <p>This is to certify that <strong>{full_name}</strong> has successfully repaid all dues against the loan granted under the following details:</p>
                    
                    <div class="detail-row">
                        <span class="detail-label">Loan Number:</span>
                        <span class="detail-value">{loan_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Original Loan Amount:</span>
                        <span class="detail-value">₹{original_amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Amount Paid:</span>
                        <span class="detail-value">₹{total_paid:,.2f}</span>
                    </div>
                    
                    <p style="margin-top: 30px;">The borrower is hereby informed that all outstanding dues, including principal, interest, charges, and penalties, if any, have been fully settled. The borrower's loan account is now <strong>CLOSED</strong> with no outstanding liabilities.</p>
                    
                    <p>This certificate is issued as per the request of the borrower and may be used for all official purposes.</p>
                </div>
                
                <div class="seal">🏆</div>
                
                <div class="signature">
                    <p>Issued by: <strong>NexLoan — Powered by Theoremlabs</strong></p>
                    <p>This is a computer-generated certificate and does not require signature.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
