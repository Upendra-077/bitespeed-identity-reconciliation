# Bitespeed Backend Task - Identity Reconciliation

## 🚀 Overview

This project implements the `/identify` endpoint required for the Bitespeed Backend Task.

The service reconciles customer identities across multiple purchases using email and phone number matching logic.

It ensures:
- Primary and secondary contact management
- Identity merging
- Primary-to-secondary conversion
- Transaction safety
- Clean API response format

---

## 🛠 Tech Stack

- Node.js (v20)
- TypeScript
- Express
- Prisma ORM
- SQLite (for development)
- Docker

---

## 🧠 Identity Reconciliation Logic

Contacts are linked if:

- They share the same email
- OR they share the same phone number

Rules:

- The oldest contact in a linked group becomes `primary`
- All others become `secondary`
- If two primaries get connected, the older remains primary
- All operations run inside a database transaction

---

## 📦 API Endpoint

### POST `/identify`

### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}



Expected Response (Status 200 OK)
JSON
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "doc@fluxkart.com",
      "emmett.brown@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [
      2
    ]
  }
}
⚙️ Running Locally
1. Clone the repository and install dependencies:

Bash
npm install
2. Initialize the database and generate the Prisma client:

Bash
npx prisma db push
npx prisma generate
3. Start the development server:

Bash
npm run dev
The server will start on http://localhost:3000.

