
import asyncio
import logging
from app.config import settings
from app.services.email_service import send_otp_email

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

async def test_email():
    print("\n" + "="*50)
    print("🚀 NEXLOAN EMAIL CONFIGURATION TEST")
    print("="*50)
    print(f"SMTP Host: {settings.SMTP_HOST}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USERNAME}")
    print(f"From:      {settings.EMAIL_FROM}")
    print("="*50)

    test_email_addr = input("Enter an email address to send a test OTP to: ")
    
    print(f"\n⏳ Sending test OTP to {test_email_addr}...")
    
    success = await send_otp_email(
        email=test_email_addr,
        otp="123456",
        full_name="NexLoan Test User"
    )

    if success:
        print("\n✅ SUCCESS! The email was sent. Please check your inbox (and spam folder).")
    else:
        print("\n❌ FAILED. Check the error logs above for details.")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(test_email())
