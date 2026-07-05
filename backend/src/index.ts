import "dotenv/config";
import express from "express";
import walletRouter from "./routes/wallet.route.js";
import transactionRouter from "./routes/transaction.route.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json()); // Parse request body JSON

// CORS sederhana untuk development — Frontend (localhost:3000) boleh akses
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/wallets", walletRouter);
app.use("/api/transactions", transactionRouter);

// Handler untuk route yang tidak ditemukan
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found", message: "Endpoint tidak ditemukan." });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Kirim Backend berjalan di http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Wallets:      http://localhost:${PORT}/api/wallets`);
  console.log(`   Transactions: http://localhost:${PORT}/api/transactions\n`);
});
