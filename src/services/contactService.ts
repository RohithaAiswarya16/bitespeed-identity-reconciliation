import Database from '../database/database';
import { Contact, IdentifyRequest, IdentifyResponse } from '../types/contact';

class ContactService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async identifyContact(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    const existingContacts = await this.findExistingContacts(email, phoneNumber);

    if (existingContacts.length === 0) {
      const newContact = await this.createNewContact(email, phoneNumber, 'primary');
      return this.buildResponse([newContact]);
    }
    
    // Using a Set to get unique contacts based on ID
    const uniqueExistingContacts = [...new Map(existingContacts.map(c => [c.id, c])).values()];

    const needsNewContact = this.shouldCreateNewContact(uniqueExistingContacts, email, phoneNumber);
    
    if (needsNewContact) {
      const primaryContact = await this.findPrimaryContact(uniqueExistingContacts);
      const newContact = await this.createNewContact(email, phoneNumber, 'secondary', primaryContact.id);
      uniqueExistingContacts.push(newContact);
    }

    await this.linkContactChains(uniqueExistingContacts);

    const allContacts = await this.getAllLinkedContacts(uniqueExistingContacts);

    return this.buildResponse(allContacts);
  }

  private async findExistingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    if (!email && !phoneNumber) {
      return [];
    }
    
    // First, find initial matches
    const initialMatches = await this.db.all(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL AND (${[email && 'email = ?', phoneNumber && 'phoneNumber = ?'].filter(Boolean).join(' OR ')})
      ORDER BY createdAt ASC
    `, [email, phoneNumber].filter(Boolean));

    if (initialMatches.length === 0) {
        return [];
    }

    // Now, find all contacts linked to the initial matches
    const linkedIds = new Set<number>();
    initialMatches.forEach(c => {
        if(c.linkedId) linkedIds.add(c.linkedId);
        if(c.linkPrecedence === 'primary') linkedIds.add(c.id);
    });

    const allRelatedContacts = await this.db.all(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL AND (id IN (${Array.from(linkedIds).map(() => '?').join(',')}) OR linkedId IN (${Array.from(linkedIds).map(() => '?').join(',')}))
      ORDER BY createdAt ASC
    `, [...linkedIds, ...linkedIds]);
    
    return allRelatedContacts;
  }

  private shouldCreateNewContact(existingContacts: Contact[], email?: string, phoneNumber?: string): boolean {
    const hasEmail = email ? existingContacts.some(c => c.email === email) : true;
    const hasPhoneNumber = phoneNumber ? existingContacts.some(c => c.phoneNumber === phoneNumber) : true;
    return !hasEmail || !hasPhoneNumber;
  }

  // FIX: This function now correctly handles the case where a contact might not be found.
  private async findPrimaryContact(contacts: Contact[]): Promise<Contact> {
    // Find the oldest contact, which will be the primary or linked to the primary
    const oldestContact = contacts[0];
    if (!oldestContact) {
      throw new Error("Could not find a primary contact from an empty list.");
    }

    if (oldestContact.linkPrecedence === 'primary') {
      return oldestContact;
    }

    // If the oldest contact is secondary, find its primary
    const primaryContact = await this.db.get(
      'SELECT * FROM Contact WHERE id = ? AND deletedAt IS NULL',
      [oldestContact.linkedId]
    );

    if (!primaryContact) {
      throw new Error(`Could not find primary contact with ID ${oldestContact.linkedId}`);
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
    const primaryContacts = contacts.filter(c => c.linkPrecedence === 'primary');
    
    // If there's one or zero primary contacts, no merging is needed
    if (primaryContacts.length <= 1) return;

    // The first one in the sorted list is the oldest
    const oldestPrimary = primaryContacts[0];
    const otherPrimaryContacts = primaryContacts.slice(1);
    const idsToDemote = otherPrimaryContacts.map(c => c.id);

    // Demote other primary contacts to secondary
    await this.db.run(`
      UPDATE Contact 
      SET linkPrecedence = 'secondary', linkedId = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id IN (${idsToDemote.map(() => '?').join(',')})
    `, [oldestPrimary.id, ...idsToDemote]);
  }

  // FIX: This function now correctly handles the result from the fixed findPrimaryContact
  private async getAllLinkedContacts(contacts: Contact[]): Promise<Contact[]> {
    if (contacts.length === 0) return [];

    const primaryContact = await this.findPrimaryContact(contacts);

    const allLinkedContacts = await this.db.all(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL AND (id = ? OR linkedId = ?)
      ORDER BY createdAt ASC
    `, [primaryContact.id, primaryContact.id]);

    return allLinkedContacts;
  }
  
  // FIX: Added null checks to satisfy TypeScript
  private buildResponse(contacts: Contact[]): IdentifyResponse {
    if (contacts.length === 0) {
      throw new Error('Cannot build response with no contacts.');
    }

    const primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];
    const secondaryContacts = contacts.filter(c => c.id !== primaryContact.id);

    const emails = Array.from(new Set(contacts.map(c => c.email).filter(Boolean))) as string[];
    const phoneNumbers = Array.from(new Set(contacts.map(c => c.phoneNumber).filter(Boolean))) as string[];
    const secondaryContactIds = secondaryContacts.map(c => c.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }
}

export default ContactService;
