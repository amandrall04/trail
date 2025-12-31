
import { NodeCategory } from './types';

export const COLORS = {
  INPUT: '#2ecc71',
  TRANSFORM: '#3498db',
  LOGIC: '#f39c12',
  OUTPUT: '#9b59b6',
  BG_DARK: '#1a1a1a',
  BG_CARD: '#252525',
  BG_HOVER: '#333333',
  TEXT_LIGHT: '#e0e0e0',
  TEXT_DIM: '#a0a0a0',
  ACCENT: '#6366f1',
};

export const NODE_TEMPLATES = [
  // Input Nodes (Expanded)
  { type: 'file_upload', category: 'INPUT' as NodeCategory, label: 'Multi-File Upload' },
  { type: 'pdf_extractor', category: 'INPUT' as NodeCategory, label: 'PDF Data Extractor' },
  { type: 'xml_parser', category: 'INPUT' as NodeCategory, label: 'XML Stream' },
  { type: 'google_sheets', category: 'INPUT' as NodeCategory, label: 'Google Sheets' },
  { type: 'sql_connector', category: 'INPUT' as NodeCategory, label: 'SQL Server' },
  { type: 'api_live', category: 'INPUT' as NodeCategory, label: 'Live API Feed' },
  { type: 'web_scraper', category: 'INPUT' as NodeCategory, label: 'Web Scraper' },
  
  // Transform Nodes (Expanded)
  { type: 'filter', category: 'TRANSFORM' as NodeCategory, label: 'Smart Filter' },
  { type: 'map_rename', category: 'TRANSFORM' as NodeCategory, label: 'Column Mapping' },
  { type: 'aggregate', category: 'TRANSFORM' as NodeCategory, label: 'Pivot/Aggregate' },
  { type: 'join_merge', category: 'TRANSFORM' as NodeCategory, label: 'Join / Merge' },
  { type: 'sort', category: 'TRANSFORM' as NodeCategory, label: 'Sorting' },
  { type: 'clean_data', category: 'TRANSFORM' as NodeCategory, label: 'Clean Data' },

  // Logic Nodes
  { type: 'if_condition', category: 'LOGIC' as NodeCategory, label: 'IF Condition' },
  { type: 'switch', category: 'LOGIC' as NodeCategory, label: 'Switch' },
  { type: 'merge', category: 'LOGIC' as NodeCategory, label: 'Union' },

  // Output Nodes (Expanded)
  { type: 'export_file', category: 'OUTPUT' as NodeCategory, label: 'Multi-Format Export' },
  { type: 'webhook', category: 'OUTPUT' as NodeCategory, label: 'Webhook Push' },
  { type: 'display', category: 'OUTPUT' as NodeCategory, label: 'UI Dashboard' },
  { type: 'chart', category: 'OUTPUT' as NodeCategory, label: 'Live Chart' },
];
