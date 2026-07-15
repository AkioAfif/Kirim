# Kirim Demo Guide (APAC Stellar Hackathon)

This document contains a step-by-step guide to seamlessly demonstrate the **Kirim** application. Ensure all prerequisites are met before starting the demo in front of the judges or teammates.

---

## 1. Initial Setup (Prerequisites)

Ensure you have installed Node.js and installed dependencies in both main directories:

```bash
# Terminal 1 - Backend
cd backend
npm install

# Terminal 2 - Frontend
cd frontend
npm install
```

Make sure you also have a Supabase database set up and the environment variables (`.env`) properly configured in both `backend/.env` and `frontend/.env`.

---

## 2. Treasury Wallet Setup (Required Before Demo)

The Kirim application utilizes a **Treasury** concept as a central wallet that holds reserve assets (XLM, TESTUSD, etc.) to facilitate gasless transactions for end users.

If this is a new testnet environment, follow these steps:

1. **Create and Fund Treasury:**
   - Generate a new wallet for the Treasury.
   - Open the [Stellar Laboratory Faucet](https://laboratory.stellar.org/#account-creator?network=test) and enter your Treasury's public key to get an initial XLM balance (to pay for transaction fees).
2. **Configure in Backend:**
   - Open `backend/.env`.
   - Enter the wallet's secret key into `TREASURY_SECRET_KEY`.
3. **Asset Configuration:**
   - Ensure the `ISSUER_SECRET_KEY` variable is also set (this is the wallet that mints TESTUSD).
   - *Optional (If never done before)*: Run this command inside the `backend` folder to establish a TESTUSD trustline for the Treasury.
     ```bash
     npm run setup:testusd
     ```

*(Note: Ensure the Treasury wallet has a sufficient USDC (Blend Testnet) balance. USDC can be obtained from the faucet at [testnet.blend.capital](https://testnet.blend.capital) — click the "receive assets for Blend test network" button. The Treasury also requires an XLM balance from the Stellar Laboratory Faucet to cover transaction fees).*

---

## 3. Running the Application

Run the backend and frontend in two separate terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open the local URL that appears in the terminal (usually `http://localhost:5173`) in your browser.

---

## 4. Demonstration Flow (Demo Flow)

When presenting the Kirim application, follow this scenario flow so the judges can understand the value of this app:

### Step A: Login & Auto-Registration
- Use the existing Auth feature (you can register a new account with a dummy email or use an existing account).
- **Demo Point:** Explain that the application automatically creates a Stellar wallet in the background. Users do not have to worry about storing a 24-word seed phrase (*Custodial-lite wallet* concept).

### Step B: Top Up (On-Ramp)
- Open the **Top Up Tab** (down arrow icon in the sidebar).
- Enter the amount of Malaysian Ringgit (MYR) you wish to deposit.
- Click **Pay via FPX**.
- **Demo Point:** Show that the TESTUSD balance (the asset representing US dollars on Stellar) immediately increases in real-time.

### Step C: Saving in Blend (Yield)
- Open the **Blend Savings** tab.
- Enter a portion of the newly topped-up TESTUSD balance.
- Click **Deposit**.
- **Demo Point:** Explain that the user's money is now deployed in an actual DeFi protocol (Blend Protocol) to earn real-time yield (~0.06% APY) fully on-chain, while the UI experience remains as simple as a regular banking app. The deposit and withdraw transactions occur entirely on-chain via the Soroban Smart Contract.

### Step D: Cross-Border Remittance
- Open the **Send** tab.
- Enter the transfer amount and the recipient's public key (can use a family member's wallet in Indonesia).
- **Demo Point:** Emphasize cost savings. Kirim cuts out traditional bank intermediaries so the fee is nearly $0 (utilizing gasless transactions subsidized by our Treasury), much cheaper than traditional remittance which costs ~4.8%.

### Step E: Disbursement (Off-Ramp)
- Open the **Withdraw** tab.
- Enter the amount of TESTUSD to convert to Indonesian Rupiah (IDR).
- **Demo Point:** The disbursed money immediately arrives in the recipient's bank account (simulation) within seconds thanks to the reliability of the Stellar network.

---

## Good luck with your demo! 🚀
