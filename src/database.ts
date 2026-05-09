import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'aurora.db');

export async function initDb() {
  const db = new sqlite3.Database(DB_PATH);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("Initializing database schema...");
      // 1. Tables with constraints
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        FullName TEXT NOT NULL,
        UniversityID TEXT UNIQUE NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        PasswordHash TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Tools (
        ToolID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Category TEXT CHECK (Category IN ('Jewelry', '3D Print', 'CNC', 'Laser', 'Woodworking')),
        DailyRate DECIMAL(10, 2) NOT NULL,
        BuyPrice DECIMAL(10, 2) NOT NULL,
        Deposit DECIMAL(10, 2) NOT NULL,
        Status TEXT DEFAULT 'Available' CHECK (Status IN ('Available', 'Rented', 'Maintenance')),
        ImageURL TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Rentals (
        RentalID INTEGER PRIMARY KEY AUTOINCREMENT,
        ToolID INTEGER NOT NULL,
        UserID INTEGER NOT NULL,
        StartDate TEXT NOT NULL,
        EndDate TEXT NOT NULL,
        TotalFee DECIMAL(10, 2) NOT NULL,
        RentalStatus TEXT DEFAULT 'Active' CHECK (RentalStatus IN ('Active', 'Completed', 'Overdue')),
        FOREIGN KEY (ToolID) REFERENCES Tools(ToolID),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
      )`);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS tr_UpdateToolOnReturn
        AFTER UPDATE ON Rentals
        WHEN NEW.RentalStatus = 'Completed'
        BEGIN
          UPDATE Tools SET Status = 'Available' WHERE ToolID = NEW.ToolID;
        END
      `);

      // Seed Data
      db.get("SELECT COUNT(*) as count FROM Tools", (err, row: any) => {
        if (err) {
          console.error("Database error:", err);
          return reject(err);
        }
        
        if (row.count === 0) {
          console.log("Seeding initial tools...");
          const tools = [
            ['Formlabs Form 3B+', '3D Print', 45.00, 3500.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1631281434193-96b65f492b4a?auto=format&fit=crop&q=80&w=400'],
            ['Desktop CNC Nomad 3', 'CNC', 60.00, 2800.00, 300.00, 'Available', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400'],
            ['Glowforge Pro Laser', 'Laser', 80.00, 6000.00, 500.00, 'Available', 'https://images.unsplash.com/photo-1590494165264-1ebe3602eb80?auto=format&fit=crop&q=80&w=400'],
            ['Durston Rolling Mill', 'Jewelry', 25.00, 1200.00, 150.00, 'Available', 'https://images.unsplash.com/photo-1551061952-ec0691e8460f?auto=format&fit=crop&q=80&w=400'],
            ['Pepe Tools Mandrel', 'Jewelry', 15.00, 450.00, 100.00, 'Available', 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&q=80&w=400'],
            ['Bambu Lab X1-Carbon', '3D Print', 35.00, 1500.00, 150.00, 'Available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'],
            ['Wacom Cintiq Pro 27', '3D Print', 100.00, 3500.00, 400.00, 'Available', 'https://images.unsplash.com/photo-1542744095-2ad484879684?auto=format&fit=crop&q=80&w=400'],
            ['Mitre Saw Kapex', 'Woodworking', 50.00, 1600.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400'],
            ['Sinterit Lisa Pro', '3D Print', 150.00, 12000.00, 1000.00, 'Available', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=400'],
            ['Desktop Lathe 210V', 'CNC', 40.00, 1100.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=400']
          ];
          const stmt = db.prepare("INSERT INTO Tools (Name, Category, DailyRate, BuyPrice, Deposit, Status, ImageURL) VALUES (?, ?, ?, ?, ?, ?, ?)");
          tools.forEach(t => stmt.run(t));
          stmt.finalize();

          db.run("INSERT INTO Users (FullName, UniversityID, Email, PasswordHash) VALUES (?, ?, ?, ?)", 
                 ['M. Hammad', 'U123456', 'mhammadzub@gmail.com', 'hashed_pass_123'], () => {
                   console.log("Database initialized and seeded.");
                   resolve(db);
                 });
        } else {
          console.log("Database check complete. Skipping seed.");
          resolve(db);
        }
      });
    });
  });
}

export function getDb() {
  return new sqlite3.Database(DB_PATH);
}
