# Bitespeed Identity Reconciliation Backend

A Node.js/TypeScript backend service for identity reconciliation that links customer contacts across multiple purchases using email and phone number matching.

## 🚀 Live Demo

**API Endpoint**: `https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify`

**Health Check**: `https://bitespeed-identity-reconciliation-h2rl.onrender.com/health`

## 🎯 Assignment Overview

This project implements the Bitespeed Backend Task for Identity Reconciliation. The system helps FluxKart.com identify and link customer contacts across multiple purchases, even when customers use different email addresses and phone numbers.

## ✨ Features

- **Identity Reconciliation**: Links customer contacts based on shared email or phone numbers
- **Primary/Secondary Linking**: Maintains hierarchical contact relationships with oldest contact as primary
- **Contact Chain Merging**: Automatically merges separate contact chains when common information is discovered
- **RESTful API**: Clean `/identify` endpoint for contact consolidation
- **SQLite Database**: Lightweight, file-based database for contact storage
- **TypeScript**: Full type safety and better development experience
- **Production Ready**: Deployed on Render.com with proper error handling

## 🔗 API Endpoint

### POST `/identify`

Consolidates contact information and returns linked contact details.

**Live Endpoint**: `https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify`

**Request Body:**
```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

## 🗄️ Database Schema

```sql
Contact {
  id                INTEGER PRIMARY KEY
  phoneNumber       TEXT
  email             TEXT
  linkedId          INTEGER (Foreign Key to Contact.id)
  linkPrecedence    TEXT ('primary' | 'secondary')
  createdAt         DATETIME
  updatedAt         DATETIME
  deletedAt         DATETIME
}
```

## 🧠 Business Logic

1. **New Customer**: Creates primary contact when no existing matches found
2. **Existing Customer**: Links new information to existing contact chain
3. **Contact Merging**: Merges separate contact chains when common information is found
4. **Primary Selection**: Oldest contact becomes primary, others become secondary

### Example Scenarios

#### Scenario 1: New Customer
```bash
curl -X POST https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

#### Scenario 2: Link Existing Contact
```bash
curl -X POST https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

#### Scenario 3: Merge Contact Chains
```bash
curl -X POST https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

## 🧪 Testing with Postman

A comprehensive Postman collection is included in the repository:

1. **Import Collection**: Use `postman-collection.json`
2. **Environment**: Collection uses `{{baseUrl}}` variable
3. **Test Scenarios**: 10+ pre-configured requests covering all edge cases
4. **Sequential Testing**: Run requests 1-10 in order to see complete flow

### Quick Test Commands

**Health Check:**
```bash
curl https://bitespeed-identity-reconciliation-h2rl.onrender.com/health
```

**Test Identity Reconciliation:**
```bash
curl -X POST https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

## 🏗️ Project Structure

```
src/
├── database/
│   └── database.ts          # SQLite database connection and queries
├── services/
│   └── contactService.ts    # Core business logic for contact reconciliation
├── routes/
│   └── identify.ts          # API route handlers
├── types/
│   └── contact.ts           # TypeScript type definitions
├── middleware/
│   └── validation.ts        # Request validation middleware
└── index.ts                 # Express server setup
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables
Create a `.env` file:
```env
PORT=3000
NODE_ENV=development
```

## 🌐 Deployment

This service is deployed on **Render.com** using the free tier.

**Deployment Configuration:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Database**: SQLite (file-based, created automatically)

For detailed deployment instructions, see `DEPLOYMENT.md`.

## 🔍 Key Implementation Details

- **Contact Linking**: Contacts are linked when they share email or phone number
- **Primary Precedence**: Oldest contact (by createdAt) becomes primary
- **Chain Merging**: When linking separate contact chains, the oldest primary contact becomes the new primary
- **Data Integrity**: All operations maintain referential integrity and proper linking
- **Response Format**: Returns consolidated contact information with all linked emails and phone numbers
- **Error Handling**: Comprehensive validation and error responses
- **Production Ready**: Optimized for deployment with proper logging and error handling

## 📊 API Response Examples

### New Primary Contact
**Request:**
```json
{"email": "doc@hillvalley.edu", "phoneNumber": "555555"}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["doc@hillvalley.edu"],
    "phoneNumbers": ["555555"],
    "secondaryContactIds": []
  }
}
```

### Linked Secondary Contact
**Request:**
```json
{"email": "emmett@hillvalley.edu", "phoneNumber": "555555"}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["doc@hillvalley.edu", "emmett@hillvalley.edu"],
    "phoneNumbers": ["555555"],
    "secondaryContactIds": [2]
  }
}
```

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Deployment**: Render.com
- **Testing**: Postman collection included
- **Development**: tsx for hot reloading

## 📝 Assignment Requirements Fulfilled

- ✅ **Web service with `/identify` endpoint**
- ✅ **HTTP POST requests with JSON body**
- ✅ **HTTP 200 responses with consolidated contact**
- ✅ **Proper contact linking and precedence logic**
- ✅ **Primary/secondary contact management**
- ✅ **Contact chain merging functionality**
- ✅ **SQL database implementation**
- ✅ **Node.js with TypeScript**
- ✅ **Hosted online with public endpoint**
- ✅ **GitHub repository with meaningful commits**

## 🤝 Contributing

This is an assignment project, but feel free to explore the code and suggest improvements!

---

**Live API**: https://bitespeed-identity-reconciliation-h2rl.onrender.com/identify

**Repository**: https://github.com/RohithaAiswarya16/bitespeed-identity-reconciliation
