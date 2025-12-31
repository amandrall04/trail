
export type NodeCategory = 'INPUT' | 'TRANSFORM' | 'LOGIC' | 'OUTPUT';

export interface NodeData {
  id: string;
  type: string;
  category: NodeCategory;
  label: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface DataRow {
  [key: string]: any;
}

export interface Dataset {
  name: string;
  columns: string[];
  rows: DataRow[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: any;
  chartType?: string;
}
