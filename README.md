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