import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb, getDb } from "./src/database";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  await initDb();

  // DBMS Logic Emulation (API Layer)
  
  // 1. Marketplace: Get all tools
  app.get("/api/tools", (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM Tools", (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
      db.close();
    });
  });

  // 2. sp_CheckToolAvailability emulation
  app.post("/api/availability", (req, res) => {
    const { toolId, startDate, endDate } = req.body;
    const db = getDb();
    const query = `
      SELECT COUNT(*) as conflicts FROM Rentals 
      WHERE ToolID = ? 
      AND RentalStatus = 'Active'
      AND ((StartDate <= ? AND EndDate >= ?) OR (StartDate <= ? AND EndDate >= ?))
    `;
    db.get(query, [toolId, startDate, startDate, endDate, endDate], (err, row: any) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ available: row.conflicts === 0 });
    });
  });

  // 3. sp_ProcessRental emulation
  app.post("/api/rent", (req, res) => {
    const { userId, toolId, days, startDate: requestedStartDate } = req.body;
    const db = getDb();
    
    db.get("SELECT DailyRate, Deposit FROM Tools WHERE ToolID = ?", [toolId], (err, tool: any) => {
      if (err || !tool) {
        db.close();
        return res.status(404).json({ error: "Tool not found" });
      }

      const startDate = requestedStartDate || new Date().toISOString().split('T')[0];
      const endDate = new Date(new Date(startDate).getTime() + days * 86400000).toISOString().split('T')[0];
      const totalFee = (tool.DailyRate * days) + tool.Deposit;

      // Double check availability before confirming
      const checkQuery = `
        SELECT COUNT(*) as conflicts FROM Rentals 
        WHERE ToolID = ? 
        AND RentalStatus = 'Active'
        AND ((StartDate <= ? AND EndDate >= ?) OR (StartDate <= ? AND EndDate >= ?))
      `;

      db.get(checkQuery, [toolId, startDate, startDate, endDate, endDate], (err, row: any) => {
        if (err || row.conflicts > 0) {
          db.close();
          return res.status(400).json({ error: "Tool is occupied during these cycles" });
        }

        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          db.run(
            "INSERT INTO Rentals (ToolID, UserID, StartDate, EndDate, TotalFee, RentalStatus) VALUES (?, ?, ?, ?, ?, ?)",
            [toolId, userId, startDate, endDate, totalFee, 'Active']
          );
          db.run("UPDATE Tools SET Status = 'Rented' WHERE ToolID = ?", [toolId]);
          db.run("COMMIT", (err) => {
            db.close();
            if (err) res.status(500).json({ error: "Relational write failed" });
            else res.json({ success: true, totalFee });
          });
        });
      });
    });
  });

  // 4. User Dashboard: My Rentals
  app.get("/api/rentals/:userId", (req, res) => {
    const db = getDb();
    const query = `
      SELECT r.*, t.Name, t.ImageURL, t.Category 
      FROM Rentals r 
      JOIN Tools t ON r.ToolID = t.ToolID 
      WHERE r.UserID = ?
    `;
    db.all(query, [req.params.userId], (err, rows) => {
      db.close();
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  // Returning a Tool (Testing Trigger)
  app.post("/api/return", (req, res) => {
    const { rentalId } = req.body;
    const db = getDb();
    db.run("UPDATE Rentals SET RentalStatus = 'Completed' WHERE RentalID = ?", [rentalId], function(err) {
      db.close();
      if (err) res.status(500).json({ error: err.message });
      else res.json({ success: true });
    });
  });

  // 5. Admin Analytics
  app.get("/api/admin/stats", (req, res) => {
    const db = getDb();
    const stats: any = {};
    
    db.serialize(() => {
      db.get("SELECT SUM(TotalFee) as totalRevenue FROM Rentals WHERE RentalStatus != 'Cancelled'", (err, row: any) => {
        stats.totalRevenue = row?.totalRevenue || 0;
      });
      db.get("SELECT COUNT(*) as activeCount FROM Rentals WHERE RentalStatus = 'Active'", (err, row: any) => {
        stats.activeRentals = row?.activeCount || 0;
      });
      db.all(`
        SELECT t.Name, COUNT(r.RentalID) as count 
        FROM Tools t 
        LEFT JOIN Rentals r ON t.ToolID = r.ToolID 
        GROUP BY t.ToolID, t.Name 
        ORDER BY count DESC 
        LIMIT 5
      `, (err, rows) => {
        stats.popularTools = rows;
      });
      db.all(`
        SELECT r.*, t.Name 
        FROM Rentals r 
        JOIN Tools t ON r.ToolID = t.ToolID 
        WHERE r.EndDate < date('now') AND r.RentalStatus = 'Active'
      `, (err, rows) => {
        stats.overdueRentals = rows;
        res.json(stats);
        db.close();
      });
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AURORA Server running on http://localhost:${PORT}`);
  });
}

startServer();
