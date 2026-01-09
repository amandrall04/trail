# Technical Requirements Document (TRD): Kyros Data Assistant

## 1. System Architecture
Kyros is a client-side Single Page Application (SPA) utilizing a modular architecture to handle heavy data processing and AI orchestration within the browser.

## 2. Tech Stack
- **Core:** React 19 (TypeScript)
- **Styling:** Tailwind CSS + Lucide React
- **AI Orchestration:** @google/genai (Gemini 3 Flash Preview)
- **Visualization:** Recharts (SVG-based responsive charts)
- **Data Processing:** SheetJS (XLSX)
- **Document Generation:** jsPDF, html-to-image, JSZip

## 3. Module Specifications

### 3.1 Analysis Engine (`App.tsx`)
- **Context Injection:** On every query, the engine samples the first 5 rows of the `Dataset` and the full `columns` list to provide the LLM with precise schema context.
- **Response Handling:** Enforces a JSON schema via `responseMimeType: 'application/json'` to ensure structured data for the `Recharts` components.

### 3.2 Workflow Orchestrator (Canvas)
- **Physics & Positioning:** Nodes use absolute positioning relative to a virtual 10,000px coordinate system.
- **Connection Logic:** Connections are rendered as SVG Cubic Bezier curves. Pathing formula:
  `M x1 y1 C (x1 + dx) y1, (x2 - dx) y2, x2 y2` where `dx` is 50% of the horizontal distance.
- **State Persistence:** Pipeline configuration is stored in a normalized `nodes` and `connections` array state.

### 3.3 Export Pipeline
- **Chart Serialization:** Uses `html-to-image` to capture SVG elements from the DOM and convert them to Base64 PNGs at 2x pixel ratio.
- **PDF Generation:** Implements `jsPDF` for multi-page document synthesis.
- **Sanitization:** Implements a filter `messages.filter(m => m.role === 'assistant')` to ensure "Clean Exports" exclude raw user inputs.

## 4. Performance & Scalability
- **Virtualization:** Large datasets are truncated to 50 rows in the UI view to maintain 60fps scrolling while keeping the full dataset in memory for analysis.
- **Asset Management:** All icons are SVGs (Lucide) to minimize the footprint.
