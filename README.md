# NexLoan 🚀

NexLoan is a state-of-the-art, **AI-first personal loan origination platform** built for speed, compliance, and transparency. It leverages modern web technologies and local AI processing to verify identity, underwrite loans, and provide a seamless conversational interface for users.

---

## 🌟 Key Features

- **OTP-Based Authentication**: Passwordless login system.
- **Local AI KYC Engine**: PAN and Aadhaar card verification running locally via Tesseract OCR—fast, private, and deterministic. No more expensive external cloud vision APIs for basic layout text extractions.
- **Identity Fraud Protection**: Fuzzy matching between applicant submitted names and physically OCR-extracted names from documents.
- **RBI Digital Lending Compliance**:
  - Automatically generates **Key Fact Statement (KFS)** prior to loan disbursement.
  - Implements a strict **3-day Cooling-off Period** for loan cancellations without penalties.
  - Transparent **DLA & LSP Disclosures** to users.
  - Strong **Data Privacy** (e.g., auto-masking the first 8 digits of Aadhaar).
- **Intelligent Underwriting Engine**: Simulates risk assessment utilizing custom Debt-to-Income (DTI) and credit score algorithms to determine approval amounts.
- **Conversational AI Chatbot**: Built-in Groq LLM chatbot for continuous customer support, intelligently accessing user loan context with an extremely strict English-only enforcement policy.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Next.js Client]
        UI[Tailwind UI / Dashboard]
        Chat[Chatbot Widget]
        KYC_UI[KYC Document Upload]
    end

    %% API Layer
    subgraph Backend [FastAPI Server]
        Auth[OTP/JWT Auth Service]
        AppRouter[Application & Disbursement Router]
        BotRouter[Chatbot Session Router]
    end

    %% Internal Services
    subgraph Services [Internal AI & Logic]
        OCR[Local Tesseract OCR Engine]
        Underwriting[Risk Underwriting Engine]
        Groq[Groq Conversational AI]
    end

    %% Storage & Caching
    subgraph Data [Storage Layer]
        PG[(PostgreSQL)]
        R2[(Cloudflare R2 Bucket)]
        Redis[(Redis Cache / Sessions)]
    end

    %% Flow connections
    UI -->|REST APIs| Auth
    UI -->|REST APIs| AppRouter
    Chat -->|REST APIs| BotRouter
    KYC_UI -->|Multipart/Form Data| AppRouter
    
    AppRouter --> OCR
    AppRouter --> Underwriting
    AppRouter --> PG
    AppRouter --> R2
    
    BotRouter --> Redis
    BotRouter --> Groq
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy 2.0
- **Database**: PostgreSQL (via Supabase / Local)
- **Caching & State**: Redis
- **File Storage**: Cloudflare R2 (S3-compatible)
- **AI & OCR**: Groq API (Chatbot), local `Pytesseract` (KYC extraction)

---

## ⚙️ How to Run the Project Locally

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.11+)
3. **PostgreSQL** & **Redis** running locally (or remote URIs)
4. **Tesseract OCR Engine** installed locally 
   - *Windows:* Download from UB Mannheim, install to `C:\Program Files\Tesseract-OCR\tesseract.exe`
   - *Linux:* `sudo apt-get install tesseract-ocr`

### 1. Database & Environment Setup
Ensure you copy the `.env.example` to `.env` in the `backend/` folder and fill in the required keys.

```bash
# Example .env configuration variables
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/nexloan
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secret_string
R2_ACCESS_KEY_ID=...
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI server on port 8000
uvicorn app.main:app --reload
```

### 3. Start the Frontend

```bash
cd frontend
npm install

# Start the Next.js development server on port 3000
npm run dev
```

### 4. Access the Application
Open your browser and navigate to `http://localhost:3000`.

---

## 🔒 Compliance & Security Notes

This platform is modeled to adhere to Digital Lending guidelines required by regulatory bodies like the RBI. 
- **Immutable Audit Trails**: Every status change (e.g. from `INQUIRY` to `CLOSED`) generates an immutable tracking record.
- **Data Minimization & Masking**: User documents uploaded for KYC are masked (e.g., Aadhaar) prior to database insertion.
