import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs'; // Import the file system module

class Database {
  private db: sqlite3.Database;

  constructor() {
    // Define a path to a writable directory.
    // On many platforms, '/var/data' is a standard for persistent storage.
    const dataDir = path.join(__dirname, '../../../data'); // Go up from /dist/database/database.ts

    // Ensure the data directory exists before trying to create the DB file.
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'contacts.db');
    console.log(`Initializing database at: ${dbPath}`);

    this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
    });
    
    this.initializeDatabase();
  }

  private initializeDatabase() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Contact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES Contact(id)
      )
    `;

    this.db.run(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Database table checked/created successfully.');
      }
    });
  }

  async run(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async get(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export default Database;
