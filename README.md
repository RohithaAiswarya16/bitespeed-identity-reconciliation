<<<<<<< HEAD
# Bitespeed Identity Reconciliation Backend

A Node.js/TypeScript backend service for identity reconciliation that links customer contacts across multiple purchases using email and phone number matching.

## Features

- **Identity Reconciliation**: Links customer contacts based on shared email or phone numbers
- **Primary/Secondary Linking**: Maintains hierarchical contact relationships with oldest contact as primary
- **RESTful API**: Clean `/identify` endpoint for contact consolidation
- **SQLite Database**: Lightweight, file-based database for contact storage
- **TypeScript**: Full type safety and better development experience

## API Endpoint

### POST `/identify`

Consolidates contact information and returns linked contact details.

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

## Database Schema

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

## Business Logic

1. **New Customer**: Creates primary contact when no existing matches found
2. **Existing Customer**: Links new information to existing contact chain
3. **Contact Merging**: Merges separate contact chains when common information is found
4. **Primary Selection**: Oldest contact becomes primary, others become secondary

## Setup and Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Build for Production**
```bash
npm run build
npm start
```

## Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Identify Endpoint Examples

**Create New Contact:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

**Link Existing Contact:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

**Merge Contact Chains:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

## Project Structure

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

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

## Deployment

This service is designed to be deployed on platforms like:
- Render.com
- Heroku
- Railway
- DigitalOcean App Platform

The SQLite database file will be created automatically in the `data/` directory.

## Key Implementation Details

- **Contact Linking**: Contacts are linked when they share email or phone number
- **Primary Precedence**: Oldest contact (by createdAt) becomes primary
- **Chain Merging**: When linking separate contact chains, the oldest primary contact becomes the new primary
- **Data Integrity**: All operations maintain referential integrity and proper linking
- **Response Format**: Returns consolidated contact information with all linked emails and phone numbers

## Future Enhancements

- Add caching layer for improved performance
- Implement soft deletes for contact history
- Add contact merge conflict resolution
- Implement contact splitting functionality
- Add comprehensive audit logging
=======
# bitespeed-identity-reconciliation
>>>>>>> af5c075074c720550dce36902fe17a1f4600ab8f
