import Database from '../database/database';
import { Contact, IdentifyRequest, IdentifyResponse } from '../types/contact';

class ContactService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async identifyContact(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Find existing contacts with matching email or phone number
    const existingContacts = await this.findExistingContacts(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No existing contacts, create a new primary contact
      const newContact = await this.createNewContact(email, phoneNumber, 'primary');
      return this.buildResponse([newContact]);
    }

    // Check if we need to create a new secondary contact
    const needsNewContact = this.shouldCreateNewContact(existingContacts, email, phoneNumber);
    
    if (needsNewContact) {
      // Find the primary contact to link to
      const primaryContact = await this.findPrimaryContact(existingContacts);
      const newContact = await this.createNewContact(email, phoneNumber, 'secondary', primaryContact.id);
      existingContacts.push(newContact);
    }

    // Handle linking of separate contact chains
    await this.linkContactChains(existingContacts);

    // Get all contacts in the consolidated chain
    const allContacts = await this.getAllLinkedContacts(existingContacts);

    return this.buildResponse(allContacts);
  }

  private async findExistingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const conditions = [];
    const params = [];

    if (email) {
      conditions.push('email = ?');
      params.push(email);
    }

    if (phoneNumber) {
      conditions.push('phoneNumber = ?');
      params.push(phoneNumber);
    }

    if (conditions.length === 0) {
      return [];
    }

    const query = `
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL AND (${conditions.join(' OR ')})
      ORDER BY createdAt ASC
    `;

    return await this.db.all(query, params);
  }

  private shouldCreateNewContact(existingContacts: Contact[], email?: string, phoneNumber?: string): boolean {
    // Check if this exact combination already exists
    return !existingContacts.some(contact => 
      contact.email === email && contact.phoneNumber === phoneNumber
    );
  }

  private async findPrimaryContact(contacts: Contact[]): Promise<Contact> {
    // Find the oldest primary contact
    let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
    
    if (!primaryContact) {
      // If no primary found, get the primary of the first contact
      const firstContact = contacts[0];
      if (firstContact.linkedId) {
        primaryContact = await this.db.get(
          'SELECT * FROM Contact WHERE id = ? AND deletedAt IS NULL',
          [firstContact.linkedId]
        );
      } else {
        primaryContact = firstContact;
      }
    }

    return primaryContact;
  }

  private async createNewContact(
    email?: string, 
    phoneNumber?: string, 
    linkPrecedence: 'primary' | 'secondary' = 'primary',
    linkedId?: number
  ): Promise<Contact> {
    const now = new Date().toISOString();
    
    const result = await this.db.run(`
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [phoneNumber || null, email || null, linkedId || null, linkPrecedence, now, now]);

    return await this.db.get(
      'SELECT * FROM Contact WHERE id = ?',
      [result.lastID]
    );
  }

  private async linkContactChains(contacts: Contact[]): Promise<void> {
    if (contacts.length <= 1) return;

    // Group contacts by their primary contact
    const chains = new Map<number, Contact[]>();
    
    for (const contact of contacts) {
      const primaryId = contact.linkPrecedence === 'primary' ? contact.id : contact.linkedId;
      if (!chains.has(primaryId)) {
        chains.set(primaryId, []);
      }
      chains.get(primaryId)!.push(contact);
    }

    if (chains.size <= 1) return;

    // Find the oldest primary contact
    const primaryContacts = Array.from(chains.keys()).map(id => 
      contacts.find(c => c.id === id && c.linkPrecedence === 'primary')
    ).filter(Boolean) as Contact[];

    const oldestPrimary = primaryContacts.reduce((oldest, current) => 
      new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
    );

    // Convert other primary contacts to secondary
    for (const [primaryId, chainContacts] of chains) {
      if (primaryId !== oldestPrimary.id) {
        // Update the primary contact to secondary
        await this.db.run(`
          UPDATE Contact 
          SET linkPrecedence = 'secondary', linkedId = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [oldestPrimary.id, primaryId]);

        // Update all secondary contacts in this chain
        for (const contact of chainContacts) {
          if (contact.linkPrecedence === 'secondary') {
            await this.db.run(`
              UPDATE Contact 
              SET linkedId = ?, updatedAt = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [oldestPrimary.id, contact.id]);
          }
        }
      }
    }
  }

  private async getAllLinkedContacts(contacts: Contact[]): Promise<Contact[]> {
    if (contacts.length === 0) return [];

    // Find the primary contact
    const primaryContact = await this.findPrimaryContact(contacts);

    // Get all contacts linked to this primary
    const allLinkedContacts = await this.db.all(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL AND (id = ? OR linkedId = ?)
      ORDER BY createdAt ASC
    `, [primaryContact.id, primaryContact.id]);

    return allLinkedContacts;
  }

  private buildResponse(contacts: Contact[]): IdentifyResponse {
    if (contacts.length === 0) {
      throw new Error('No contacts found');
    }

    const primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
    const secondaryContacts = contacts.filter(c => c.linkPrecedence === 'secondary');

    const emails = Array.from(new Set(
      contacts.filter(c => c.email).map(c => c.email!)
    ));
    
    const phoneNumbers = Array.from(new Set(
      contacts.filter(c => c.phoneNumber).map(c => c.phoneNumber!)
    ));

    // Ensure primary contact's email and phone are first
    if (primaryContact?.email) {
      emails.unshift(primaryContact.email);
    }
    if (primaryContact?.phoneNumber) {
      phoneNumbers.unshift(primaryContact.phoneNumber);
    }

    // Remove duplicates while preserving order
    const uniqueEmails = [...new Set(emails)];
    const uniquePhoneNumbers = [...new Set(phoneNumbers)];

    return {
      contact: {
        primaryContatctId: primaryContact!.id,
        emails: uniqueEmails,
        phoneNumbers: uniquePhoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      }
    };
  }
}

export default ContactService;