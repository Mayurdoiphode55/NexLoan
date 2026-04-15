
import asyncio
import logging
from app.config import settings
from app.services.email_service import send_otp_email

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

async def test_email():
    print("\n" + "="*50)
    print("🚀 NEXLOAN EMAIL API TEST (BREVO)")
    print("="*50)
    api_key_status = "SET (Reusing SMTP_PASSWORD)" if (not settings.BREVO_API_KEY and settings.SMTP_PASSWORD) else ("SET" if settings.BREVO_API_KEY else "MISSING")
    
    print(f"API Key Status: {api_key_status}")
    print(f"App Name:       {settings.APP_NAME}")
    print(f"From:           {settings.EMAIL_FROM}")
    print("="*50)

    test_email_addr = input("Enter an email address to send a test OTP to: ")
    
    print(f"\n⏳ Sending test OTP via Brevo API to {test_email_addr}...")
    
    success = await send_otp_email(
        email=test_email_addr,
        otp="654321",
        full_name="NexLoan API Test User"
    )

    if success:
        print("\n✅ SUCCESS! The email was sent via API. Please check your inbox.")
    else:
        print("\n❌ FAILED. Check the console logs for the specific API error.")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(test_email())
