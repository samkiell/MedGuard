# MedGuard 🛡️

**Clinical Polypharmacy & Drug Safety Intelligence Platform** built for the **Ontomorph Hackathon**.

MedGuard dynamically connects patient Digital Twins with the **Ontomorph DTP SDK** and **HOLON Knowledge Graph API** to perform real-time, automated multi-drug interaction assessments, clinical class ancestry resolutions, and automated risk flagging.

---

## 🌟 Key Features

- **Digital Twin Integration (`@ontomorph/dtp-sdk`)**: Automatically connects to sandbox twin records to fetch active prescription regimens and sync updates.
- **HOLON Knowledge Graph (`@ontomorph/holon-client`)**: Resolves RxNorm codes to concept IDs, extracts ontological parent/ancestor drug classes, and assesses pairwise clinical interaction severity.
- **Fail-Safe Clinical Reference Fallback**: Guarantees system resilience with embedded reference interaction models when network connectivity or graph coverage is restricted.
- **Digital Twin Risk Flagging**: Writes flagged interaction risks directly back into the live patient record using `twin.flag()`.
- **Modular & High-Performance UI**: TailwindCSS design system with client-side query caching and responsive clinical feedback.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js 18+ installed and proper environment variables configured in `.env.local`:

```env
DTP_KEY="your_dtp_api_key"
DTP_SESSION_TOKEN="your_dtp_session_token"
HOLON_KEY="your_holon_api_key"
HOLON_API_URL="https://holon-api.ontomorph.com"
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture & Project Structure

- `app/page.tsx`: Clean main application flow rendering MedGuard components.
- `app/api/interactions/check/route.ts`: Pairwise interaction checker powered by HOLON concepts & checkList API.
- `app/api/interactions/explain/route.ts`: Detailed clinical breakdown API.
- `app/api/twin/medications/route.ts`: DTP SDK route fetching twin prescription data.
- `app/api/twin/flag/route.ts`: DTP SDK route persisting flagged interaction risks to the Digital Twin.
- `components/`: Modular React components (`Header`, `TwinBanner`, `MedicationList`, `InteractionCard`).
- `lib/`: Helper utilities, caching mechanisms (`helpers.ts`), token management (`dtpTokenManager.ts`), and TypeScript interfaces (`types.ts`).
