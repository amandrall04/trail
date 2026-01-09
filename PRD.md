# Product Requirements Document (PRD): Kyros Data Assistant

## 1. Executive Summary
**Kyros Data Assistant** is a next-generation data intelligence platform designed to bridge the gap between raw data and professional insights. It provides a dual-paradigm interface: a conversational "Quick Analyst" for instant visualization and a "Pipeline Builder" for complex data orchestration.

## 2. Target Audience
- **Data Analysts:** Looking for rapid prototyping of visualizations.
- **Business Stakeholders:** Needing to transform spreadsheets into professional reports without technical overhead.
- **Operations Managers:** Designing automated data workflows.

## 3. Key Features
### 3.1 Quick Analyst (Conversational AI)
- **Natural Language Processing:** Powered by Gemini 3 Flash to interpret complex data queries.
- **Auto-Visualization:** Automatically selects the best chart type (Bar, Line, Pie, Area) based on data distribution.
- **Context-Aware Suggestions:** Dynamic chips that suggest queries based on the uploaded dataset's schema.

### 3.2 Pipeline Builder (Low-Code Workflow)
- **Visual Canvas:** A node-based environment for designing data transformations.
- **Node Library:** 20+ functional nodes covering Input (SQL, API, Scrapers), Transform (Join, Filter, Clean), and Output (Webhooks, Export).
- **Execution Engine:** Real-time visual feedback and state tracking during pipeline runs.

### 3.3 Professional Export Suite
- **Intelligence Briefing (PDF/DOC):** Generates reports containing only AI insights and charts, automatically stripping out user prompts for a clean, professional finish.
- **Visual Gallery (ZIP):** Batch exports all generated charts as high-resolution PNGs.
- **Interactive Dashboard (HTML):** A standalone, portable dashboard file with responsive charts.

## 4. User Experience Goals
- **Information Density:** A compact, "Pro-Tool" aesthetic (Obsidian Indigo theme) that maximizes screen real estate.
- **Privacy First:** All data processing occurs in-browser; data is never stored on a centralized server.
- **Zero Latency Feel:** Instant UI updates and streaming AI responses.
