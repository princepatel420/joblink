const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Database setup
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chanda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paymentMode TEXT
    )
  `);
});

// API: Get all entries
app.get("/api/chanda", (req, res) => {
  db.all("SELECT id, name, date, amount, paymentMode FROM chanda", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    res.json(rows);
  });
});

// API: Add new entry
app.post("/api/chanda", (req, res) => {
  const { name, date, amount, paymentMode } = req.body;
  if (!name || !date || !amount || !paymentMode) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  db.run(
    "INSERT INTO chanda (name, date, amount, paymentMode) VALUES (?, ?, ?, ?)",
    [name, date, amount, paymentMode],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to insert entry." });
      res.status(201).json({ message: "Entry added successfully.", id: this.lastID });
    }
  );
});

// API: Delete entry
app.delete("/api/chanda/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM chanda WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete entry." });

    if (this.changes === 0) {
      return res.status(404).json({ message: "Entry not found." });
    }

    res.json({ message: "Entry deleted successfully." });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
