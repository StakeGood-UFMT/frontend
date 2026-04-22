# How to Run StakeGood Frontend

This project is built with Angular 17 and integrates with the Stellar Network via Soroban and the Stellar Wallets Kit.

## Prerequisites

- **Node.js**: v18 or higher (v20+ recommended)
- **Stellar Wallet**: Freighter or Albedo extension installed in your browser.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run start
   ```
   The application will be available at `http://localhost:4200/`.

## Configuration and Mocking

The project includes a built-in mock system for the Authentication API, allowing development even without a running backend.

### Toggling Mock Mode

You can switch between **Mock Mode** and **Real API Mode** by editing the environment files in `src/environments/`:

- `environment.development.ts` (used by `npm run start`)
- `environment.ts` (production)

Change the `useMock` property:
```typescript
export const environment = {
  // ...
  useMock: true, // Set to true for mock data, false for real API calls
  apiUrl: 'https://api.stakegood.org/api/v1' // Destination for real API calls
};
```

### Stellar Network Configuration

You can configure which Stellar network the application uses (e.g., TESTNET, FUTURENET) in the same environment files:

```typescript
  stellar: {
    network: 'TESTNET', // Must match your wallet configuration
    horizonUrl: 'https://horizon-testnet.stellar.org',
    rpcUrl: 'https://soroban-testnet.stellar.org'
  }
```

## Authentication Flow

1. Click **Connect Wallet**.
2. Select your provider (Freighter/Albedo).
3. Sign the authentication message (nonce) in your wallet.
4. The application will store the session (JWT) in `localStorage` and handle automatic token refresh when needed.
