"""
NexLoan Storage Service — Cloudflare R2 Integration
Handles uploading and generating public URLs for KYC documents.
"""

import boto3
import logging
from botocore.config import Config
from fastapi import UploadFile
import uuid
import os

from app.config import settings

logger = logging.getLogger("nexloan.storage")

def get_s3_client():
    """Initialize and return a Boto3 client configured for Cloudflare R2."""
    if not settings.R2_ACCOUNT_ID:
        logger.warning("⚠️ R2_ACCOUNT_ID is not set. Storage service may fail.")
        
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4")
    )


async def upload_document(file: UploadFile, folder: str = "kyc_docs") -> str:
    """
    Uploads a file to Cloudflare R2 securely.
    
    Args:
        file: The FastAPI UploadFile object
        folder: Subdirectory inside the bucket
        
    Returns:
        The public URL of the uploaded document.
    """
    try:
        # Generate a unique path: folder/uuid_filename
        extension = os.path.splitext(file.filename)[1]
        if not extension:
            extension = ".jpg" # Default to jpg if no extension is found
            
        unique_filename = f"{uuid.uuid4()}{extension}"
        s3_key = f"{folder}/{unique_filename}"
        
        # Read file content safely
        file_content = await file.read()
        await file.seek(0) # Reset pointer
        
        # Determine content type
        content_type = file.content_type or "application/octet-stream"
        
        # Upload using synchronous boto3 client
        s3_client = get_s3_client()
        s3_client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
        )
        
        logger.info(f"✅ Successfully uploaded {file.filename} to R2 as {s3_key}")
        
        # Construct the public URL
        # e.g., https://pub-xxxx.r2.dev/kyc_docs/1234-5678.jpg
        # Make sure R2_PUBLIC_URL does not have a trailing slash
        base_url = settings.R2_PUBLIC_URL.rstrip('/')
        return f"{base_url}/{s3_key}"

    except Exception as e:
        logger.error(f"❌ Failed to upload document to R2: {e}")
        raise
