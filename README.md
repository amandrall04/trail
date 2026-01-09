# Kyros Data Assistant

Kyros is an obsidian-themed, high-density data analysis platform. Talk to your data or build visual pipelines to automate your insights.

## 🚀 Features
- **Conversational Intelligence:** Query your CSV/Excel files in plain English.
- **Node-Based Builder:** Drag-and-drop workflow designer.
- **Professional Exports:** Generate clean reports for stakeholders in one click.
- **Local-First:** Your data never leaves your browser.

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+
- A Google Gemini API Key

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your API Key in your environment:
   ```bash
   export API_KEY=your_gemini_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Architecture
- `App.tsx`: The heart of the app—manages AI, charts, and canvas state.
- `constants.ts`: Visual configuration and Node templates.
- `types.ts`: Strictly typed interfaces for data and workflows.
- `index.html`: Base styles and grid background implementation.

## 📊 Design Philosophy
Kyros is designed for **Professional Density**. It avoids bulky UI elements in favor of a compact, information-rich environment. Every pixel is tuned for productivity, from the 9px fonts in the data table to the precise node connections on the canvas.

---
*Built with ❤️ by the Kyros Engineering Team.*
