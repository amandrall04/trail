import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Play, Trash2, Download, Upload, Settings, Database, Workflow, 
  MessageSquare, BarChart2, Filter as FilterIcon, Send, ArrowRight, Maximize2, 
  X, FileText, TrendingUp, Layout, Layers, Activity, Zap, CheckCircle2, 
  AlertCircle, Globe, Server, Table, Share2, FileSpreadsheet, FileJson, Image as ImageIcon,
  RefreshCcw, Link, Terminal, Code, ChevronDown, Move, FileDown, MoreVertical,
  FileCode, FileType, Layers2, Loader2, Monitor, GripVertical, FileImage
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjs from 'pdfjs-dist';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

import { COLORS, NODE_TEMPLATES } from './constants';
import { Dataset, NodeData, Connection, ChatMessage, NodeCategory, DataRow } from './types';

const INITIAL_DATA: Dataset = {
  name: 'Global Sales.csv',
  columns: ['Employee', 'Department', 'Salary', 'Location', 'Experience'],
  rows: [
    { Employee: 'Alice Chen', Department: 'Engineering', Salary: 120000, Location: 'San Francisco', Experience: 5 },
    { Employee: 'Bob Smith', Department: 'Marketing', Salary: 85000, Location: 'New York', Experience: 3 },
    { Employee: 'Charlie Davis', Department: 'Engineering', Salary: 145000, Location: 'Austin', Experience: 8 },
    { Employee: 'Diana Prince', Department: 'Sales', Salary: 95000, Location: 'Chicago', Experience: 4 },
    { Employee: 'Ethan Hunt', Department: 'Security', Salary: 110000, Location: 'London', Experience: 6 },
    { Employee: 'Fiona Gallagher', Department: 'Engineering', Salary: 130000, Location: 'San Francisco', Experience: 7 },
  ]
};

const CHART_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const SUGGESTIONS = [
  "📊 Salary by department",
  "📈 Experience vs Salary trend",
  "🗺️ Distribution by location",
  "💰 Total payroll summary",
  "💡 Key insights"
];

// Node Constants
const NODE_WIDTH = 208;
const NODE_HEIGHT = 100;

export default function App() {
  const [view, setView] = useState<'quick' | 'pipeline'>('quick');
  const [dataset, setDataset] = useState<Dataset>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowLimit, setRowLimit] = useState(50);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: 'I am Kyros, your data co-pilot. I can visualize your data, find trends, and build analysis pipelines. How can I help you today?', 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [pendingConnection, setPendingConnection] = useState<{ sourceId: string; mouseX: number; mouseY: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const filteredRows = useMemo(() => {
    let result = dataset.rows;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(term))
      );
    }
    return result;
  }, [dataset, searchTerm]);

  const displayedRows = useMemo(() => filteredRows.slice(0, rowLimit), [filteredRows, rowLimit]);

  // --- Pipeline Functions ---
  const handleDragStartFromSidebar = (e: React.DragEvent, template: typeof NODE_TEMPLATES[0]) => {
    e.dataTransfer.setData('node-template', JSON.stringify(template));
  };

  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('node-template');
    if (!data) return;
    const template = JSON.parse(data);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - canvasOffset.x - (NODE_WIDTH / 2);
    const y = e.clientY - rect.top - canvasOffset.y - (NODE_HEIGHT / 2);
    const newNode: NodeData = {
      id: `node_${Date.now()}`,
      type: template.type,
      category: template.category,
      label: template.label,
      x: Math.round(x),
      y: Math.round(y),
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialNodeX = node.x;
    const initialNodeY = node.y;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: initialNodeX + dx, y: initialNodeY + dy } : n));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPendingConnection({ sourceId: nodeId, mouseX: e.clientX - rect.left - canvasOffset.x, mouseY: e.clientY - rect.top - canvasOffset.y });
    const handleMouseMove = (mv: MouseEvent) => {
      setPendingConnection(prev => prev ? { ...prev, mouseX: mv.clientX - rect.left - canvasOffset.x, mouseY: mv.clientY - rect.top - canvasOffset.y } : null);
    };
    const handleMouseUp = () => {
      setPendingConnection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleInputPortMouseUp = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (pendingConnection && pendingConnection.sourceId !== targetId) {
      const exists = connections.some(c => c.sourceId === pendingConnection.sourceId && c.targetId === targetId);
      if (!exists) {
        setConnections(prev => [...prev, { id: `conn_${Date.now()}`, sourceId: pendingConnection.sourceId, targetId: targetId }]);
      }
    }
    setPendingConnection(null);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const deleteConnection = (connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  };

  const getPortCoords = (nodeId: string, type: 'input' | 'output') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: type === 'input' ? node.x : node.x + NODE_WIDTH, y: node.y + 64 };
  };

  // --- Export Utilities (Strictly excluding User Prompts) ---
  const captureChartImage = async (id: string): Promise<{ dataUrl: string, width: number, height: number } | null> => {
    const el = chartRefs.current[id];
    if (!el) return null;
    try {
      await new Promise(r => setTimeout(r, 400));
      return {
        dataUrl: await htmlToImage.toPng(el, { backgroundColor: '#111111', pixelRatio: 2 }),
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    } catch (e) {
      return null;
    }
  };

  const bulkExportPDF = async (chartsOnly = false) => {
    const assistantInsights = messages.filter(m => m.role === 'assistant' && m.data && m.chartType);
    if (assistantInsights.length === 0) return alert("No visualizations to export.");
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(24);
      doc.setTextColor(63, 66, 241);
      doc.text('Kyros Intelligence Briefing', 14, 25);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Generated: ${new Date().toLocaleString()} | Excludes User Queries`, 14, 32);
      doc.setDrawColor(230);
      doc.line(14, 38, 196, 38);
      let currentY = 50;

      for (let i = 0; i < assistantInsights.length; i++) {
        const msg = assistantInsights[i];
        const chartRes = await captureChartImage(msg.id);
        if (currentY > 220) { doc.addPage(); currentY = 20; }
        
        if (!chartsOnly) {
          doc.setFontSize(14);
          doc.setTextColor(40);
          doc.setFont('helvetica', 'bold');
          doc.text(`Analysis Part ${i + 1}`, 14, currentY);
          currentY += 8;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80);
          const lines = doc.splitTextToSize(msg.content, 180);
          doc.text(lines, 14, currentY);
          currentY += (lines.length * 5) + 8;
        }

        if (chartRes) {
          const w = 180;
          const h = (chartRes.height / chartRes.width) * w;
          if (currentY + h > 280) { doc.addPage(); currentY = 20; }
          doc.addImage(chartRes.dataUrl, 'PNG', 14, currentY, w, h);
          currentY += h + 20;
        }
      }
      doc.save(`Kyros_Visual_Analysis_${Date.now()}.pdf`);
    } catch (e) { console.error(e); }
    setIsExporting(false);
    setActiveMenu(null);
  };

  const bulkExportDoc = async () => {
    const assistantInsights = messages.filter(m => m.role === 'assistant' && m.data && m.chartType);
    if (assistantInsights.length === 0) return alert("No visualizations found.");
    setIsExporting(true);
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; } h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; } .insight { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; } .chart { background: #111; padding: 10px; margin-top: 10px; text-align: center; border-radius: 8px; }</style></head><body>`;
    let body = `<h1>Kyros Automated Insights</h1><p>Clean report exported on ${new Date().toLocaleString()}</p>`;
    for (let i = 0; i < assistantInsights.length; i++) {
      const msg = assistantInsights[i];
      const res = await captureChartImage(msg.id);
      body += `<div class="insight"><h3>Insight ${i + 1}</h3><p>${msg.content}</p>${res ? `<div class="chart"><img src="${res.dataUrl}" width="600" /></div>` : ''}</div><br clear="all" style="page-break-before:always" />`;
    }
    body += `</body></html>`;
    const blob = new Blob([header + body], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kyros_Findings_${Date.now()}.doc`;
    link.click();
    setIsExporting(false);
    setActiveMenu(null);
  };

  const bulkExportVisualsZip = async () => {
    const assistantInsights = messages.filter(m => m.role === 'assistant' && m.data && m.chartType);
    if (assistantInsights.length === 0) return alert("No charts to package.");
    setIsExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < assistantInsights.length; i++) {
        const res = await captureChartImage(assistantInsights[i].id);
        if (res) {
          const base64Data = res.dataUrl.split(',')[1];
          zip.file(`chart_insight_${i + 1}.png`, base64Data, { base64: true });
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kyros_Visual_Gallery_${Date.now()}.zip`;
      link.click();
    } catch (e) { console.error(e); }
    setIsExporting(false);
    setActiveMenu(null);
  };

  const generateInteractiveDashboard = (charts: ChatMessage[]) => {
    const dataInject = charts.map((c, i) => ({ id: i, title: `Finding ${i + 1}`, description: c.content, type: c.chartType || 'bar', data: c.data }));
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script><style>body { font-family: sans-serif; background: #0f172a; color: white; padding: 40px; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; } .card { background: #1e293b; padding: 25px; border-radius: 15px; } h1 { color: #818cf8; }</style></head><body><h1>Kyros Insights</h1><div class="grid" id="g"></div><script>const d = ${JSON.stringify(dataInject)}; d.forEach(item => { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<h3>'+item.title+'</h3><p>'+item.description+'</p><canvas id="c'+item.id+'"></canvas>'; document.getElementById('g').appendChild(c); new Chart(document.getElementById('c'+item.id), { type: item.type === 'area' ? 'line' : (item.type === 'pie' ? 'pie' : 'bar'), data: { labels: item.data.map(x => x.label), datasets: [{ data: item.data.map(x => x.value), backgroundColor: '#6366f1' }] } }); });</script></body></html>`;
  };

  const exportHTMLDashboard = () => {
    const assistantInsights = messages.filter(m => m.role === 'assistant' && m.data && m.chartType);
    const html = generateInteractiveDashboard(assistantInsights);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kyros_Dashboard_${Date.now()}.html`;
    link.click();
    setActiveMenu(null);
  };

  const askGemini = async (prompt: string, currentData: Dataset) => {
    if (!process.env.API_KEY) return null;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze: Columns: ${currentData.columns.join(', ')}. Query: ${prompt}`,
        config: { 
          systemInstruction: "You are Kyros. Provide analysis as JSON. Fields: answer, visualization { type, data [ { label, value } ] }.",
          responseMimeType: 'application/json'
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) { return null; }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: messageText, timestamp: Date.now() }]);
    setInput('');
    setIsLoading(true);
    let result = await askGemini(messageText, dataset);
    if (!result) result = { answer: "Processing error.", visualization: { type: 'bar', data: [] } };
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: result?.answer || "Done.", timestamp: Date.now(), data: result?.visualization?.data, chartType: result?.visualization?.type || 'bar' }]);
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      if (json.length > 0) setDataset({ name: file.name, columns: Object.keys(json[0]), rows: json });
    };
    reader.readAsArrayBuffer(file);
  };

  const renderChart = (msg: ChatMessage) => {
    if (!msg.chartType || !msg.data || msg.data.length === 0) return null;
    const commonProps = { data: msg.data, margin: { top: 10, right: 10, left: -20, bottom: 0 } };
    const renderAxis = () => (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
        <XAxis dataKey="label" stroke="#555" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#666'}} />
        <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#666'}} />
        <Tooltip cursor={{fill: '#222', strokeOpacity: 0.1}} contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
      </>
    );
    return (
      <div className="group/chart relative h-72 w-full mt-4 bg-[#111] rounded-2xl border border-gray-800/60 shadow-inner overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div ref={(el) => { chartRefs.current[msg.id] = el; }} className="h-full w-full p-8">
          <ResponsiveContainer width="100%" height="100%">
            {msg.chartType === 'pie' ? (
              <PieChart><Pie data={msg.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} stroke="#111" strokeWidth={3}>{msg.data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} /><Legend verticalAlign="bottom" wrapperStyle={{fontSize: '10px'}}/></PieChart>
            ) : msg.chartType === 'line' ? (
              <LineChart {...commonProps}>{renderAxis()}<Line type="monotone" dataKey="value" stroke={COLORS.ACCENT} strokeWidth={4} dot={{ r: 5, fill: COLORS.ACCENT, strokeWidth: 0 }} /></LineChart>
            ) : msg.chartType === 'area' ? (
              <AreaChart {...commonProps}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.ACCENT} stopOpacity={0.4}/><stop offset="95%" stopColor={COLORS.ACCENT} stopOpacity={0}/></linearGradient></defs>{renderAxis()}<Area type="monotone" dataKey="value" stroke={COLORS.ACCENT} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" /></AreaChart>
            ) : (
              <BarChart {...commonProps}>{renderAxis()}<Bar dataKey="value" fill={COLORS.ACCENT} radius={[6, 6, 0, 0]} /></BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const assistantCharts = useMemo(() => messages.filter(m => m.role === 'assistant' && m.data && m.chartType), [messages]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden text-sm bg-[#1a1a1a] select-none text-gray-300 antialiased font-['Inter']">
      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-800 bg-[#1a1a1a] z-50">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">K</div>
          <span className="font-bold text-white tracking-tight">Kyros <span className="text-gray-500 font-medium hidden sm:inline">Data Assistant</span></span>
        </div>
        <nav className="flex bg-[#252525] rounded-xl p-1 border border-gray-800">
          <button onClick={() => setView('quick')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${view === 'quick' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-gray-400 hover:text-gray-200'}`}>QUICK ANALYST</button>
          <button onClick={() => setView('pipeline')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${view === 'pipeline' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-gray-400 hover:text-gray-200'}`}>BUILDER</button>
        </nav>
        <div className="flex-1 flex justify-end gap-4"><Activity size={10} className="text-indigo-400 animate-pulse" /><div className="w-8 h-8 rounded-full bg-[#333] border border-gray-700 flex items-center justify-center text-xs font-bold ring-2 ring-transparent hover:ring-indigo-500/50 transition-all cursor-pointer">JD</div></div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        {view === 'quick' ? (
          <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500">
            <div className="flex-[2.5] flex flex-col overflow-hidden bg-[#1e1e1e] border-r border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs"><Database size={14} className="text-indigo-400" /> {dataset.name}</div>
                  <div className="relative flex-1 max-w-xs"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Search records..." className="bg-[#151515] border border-gray-700 rounded-lg py-1.5 pl-8 text-[11px] w-full outline-none focus:border-indigo-500/50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="flex gap-2">
                  <input type="file" id="file-up" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="file-up" className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer text-[10px] font-bold uppercase transition-all shadow-lg shadow-indigo-600/20"><Upload size={14} /> Import</label>
                  <button onClick={() => setDataset(INITIAL_DATA)} className="p-1.5 bg-[#252525] border border-gray-700 text-gray-400 rounded-lg hover:text-white transition-colors"><RefreshCcw size={14}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-[#151515] custom-scrollbar">
                <div className="bg-[#252525] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#2d2d2d] border-b border-gray-800"><tr>{dataset.columns.map(col => <th key={col} className="px-4 py-3 font-bold text-gray-400 uppercase text-[9px] border-r border-gray-800/50">{col}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-800/50">{displayedRows.map((row, i) => <tr key={i} className="hover:bg-indigo-500/[0.04] transition-colors">{dataset.columns.map(col => <td key={col} className="px-4 py-2.5 text-gray-400 text-[11px] border-r border-gray-800/20 truncate max-w-[150px]">{row[col]}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="flex-[1.5] flex flex-col bg-[#1a1a1a] shadow-2xl relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none grid-bg"></div>
              <div className="p-4 border-b border-gray-800 bg-[#1e1e1e]/80 backdrop-blur-md flex items-center justify-between z-10 font-bold text-gray-300 text-[10px] uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div> Intelligent Assistant</div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'clean-export' ? null : 'clean-export'); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${assistantCharts.length > 0 ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                    {isExporting ? <Loader2 size={12} className="animate-spin"/> : <Download size={12} />} Clean Export
                  </button>
                  {activeMenu === 'clean-export' && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right" onClick={(e) => e.stopPropagation()}>
                      <div className="p-3 border-b border-gray-800 text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[#151515]">Insights (Charts + Text)</div>
                      <button onClick={() => bulkExportPDF(false)} className="w-full px-4 py-3 text-left text-[10px] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-3"><FileDown size={14}/> PDF Analysis Report</button>
                      <button onClick={bulkExportDoc} className="w-full px-4 py-3 text-left text-[10px] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-3"><FileType size={14}/> Word synthesis (.doc)</button>
                      <button onClick={exportHTMLDashboard} className="w-full px-4 py-3 text-left text-[10px] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-3"><Globe size={14}/> Interactive Dashboard</button>
                      <div className="p-3 border-b border-gray-800 border-t text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[#151515]">Visuals Only (No Prompts)</div>
                      <button onClick={() => bulkExportPDF(true)} className="w-full px-4 py-3 text-left text-[10px] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-3"><FileImage size={14}/> Clean Visuals PDF</button>
                      <button onClick={bulkExportVisualsZip} className="w-full px-4 py-3 text-left text-[10px] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-3"><ImageIcon size={14}/> High-Res PNG Gallery (ZIP)</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col no-scrollbar relative z-0">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[95%] rounded-2xl p-4 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#252525] border border-gray-800 text-gray-300'}`}>
                      <p className="leading-relaxed text-xs">{msg.content}</p>
                      {msg.role === 'assistant' && renderChart(msg)}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="p-3 bg-[#252525] border border-gray-800 rounded-xl w-max animate-pulse text-[10px] text-gray-500 flex items-center gap-2"><RefreshCcw size={10} className="animate-spin text-indigo-500"/> THINKING...</div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-[#1e1e1e] border-t border-gray-800 z-10">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1 px-1">
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <button key={idx} onClick={() => handleSendMessage(suggestion)} className="whitespace-nowrap px-3 py-1.5 bg-[#252525] border border-gray-700 hover:border-indigo-500/50 text-gray-400 hover:text-white rounded-full text-[10px] transition-all active:scale-95 shadow-sm">{suggestion}</button>
                  ))}
                </div>
                <div className="relative group">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder="Ask about your data..." className="w-full bg-[#151515] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 text-gray-200 resize-none h-[56px] text-[12px]" />
                  <button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl active:scale-95 disabled:opacity-50 transition-opacity"><Send size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden relative bg-[#111] animate-in fade-in duration-500">
             <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Layers size={14} className="text-indigo-400" /> Components</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  {(['INPUT', 'TRANSFORM', 'LOGIC', 'OUTPUT'] as NodeCategory[]).map(cat => (
                    <div key={cat} className="space-y-2">
                       <div className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[cat] }}></div> {cat}</div>
                       <div className="grid grid-cols-1 gap-2">
                          {NODE_TEMPLATES.filter(n => n.category === cat).map(template => (
                            <div key={template.type} draggable onDragStart={(e) => handleDragStartFromSidebar(e, template)} className="group flex items-center gap-3 px-3 py-2.5 bg-[#252525] hover:bg-[#2d2d2d] border border-gray-800 hover:border-gray-600 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 group-hover:bg-indigo-500/10 transition-colors">{cat === 'INPUT' && <Database size={14} className="text-emerald-400" />}{cat === 'TRANSFORM' && <FilterIcon size={14} className="text-blue-400" />}{cat === 'LOGIC' && <ArrowRight size={14} className="text-orange-400" />}{cat === 'OUTPUT' && <BarChart2 size={14} className="text-purple-400" />}</div><span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-200">{template.label}</span></div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
             </div>
             <div ref={canvasRef} className="flex-1 relative overflow-hidden grid-bg cursor-crosshair" onDragOver={(e) => e.preventDefault()} onDrop={onDropOnCanvas}>
                <div className="absolute inset-0" style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}>
                   <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ width: '10000px', height: '10000px', transform: 'translate(-5000px, -5000px)' }}>
                      <g transform="translate(5000, 5000)">
                        {connections.map(conn => {
                          const start = getPortCoords(conn.sourceId, 'output');
                          const end = getPortCoords(conn.targetId, 'input');
                          const dx = Math.abs(end.x - start.x) * 0.5;
                          const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
                          return <g key={conn.id} className="group/conn pointer-events-auto cursor-pointer" onClick={() => deleteConnection(conn.id)}><path d={path} stroke="rgba(99,102,241,0.2)" strokeWidth="10" fill="none" className="hover:stroke-red-500/20 transition-colors" /><path d={path} stroke="#6366f1" strokeWidth="2" fill="none" /></g>;
                        })}
                        {pendingConnection && (() => {
                          const start = getPortCoords(pendingConnection.sourceId, 'output');
                          const end = { x: pendingConnection.mouseX, y: pendingConnection.mouseY };
                          const dx = Math.abs(end.x - start.x) * 0.5;
                          const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
                          return <path d={path} stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" fill="none" />;
                        })()}
                      </g>
                   </svg>
                   {nodes.map(node => (
                     <div key={node.id} className={`absolute w-52 bg-[#1e1e1e] border-2 rounded-2xl shadow-2xl pointer-events-auto select-none group/node transition-shadow ${selectedNodeId === node.id ? 'border-indigo-500 ring-4 ring-indigo-500/10 z-30' : 'border-gray-800 hover:border-gray-700 z-20'}`} style={{ left: node.x, top: node.y }} onMouseDown={(e) => handleNodeDragStart(e, node.id)} onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}>
                        <div className="flex items-center justify-between p-3 border-b border-gray-800/50 bg-black/20 rounded-t-2xl"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[node.category] }}></div><span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{node.category}</span></div><button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg opacity-0 group-hover/node:opacity-100 transition-opacity"><Trash2 size={12} /></button></div>
                        <div className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-gray-800">{node.category === 'INPUT' && <FileCode size={18} className="text-emerald-500" />}{node.category === 'TRANSFORM' && <Terminal size={18} className="text-blue-500" />}{node.category === 'LOGIC' && <Zap size={18} className="text-orange-500" />}{node.category === 'OUTPUT' && <Layout size={18} className="text-purple-500" />}</div><div className="overflow-hidden"><div className="text-[11px] font-bold text-gray-100 truncate">{node.label}</div><div className="text-[8px] text-gray-600 uppercase font-mono mt-0.5 tracking-tighter">READY</div></div></div>
                        <div className="flex justify-between items-center px-4 py-2 bg-black/10 rounded-b-2xl"><div className="w-4 h-4 bg-gray-700 border-2 border-[#1e1e1e] rounded-full -ml-6 flex items-center justify-center hover:bg-indigo-400 cursor-pointer transition-colors z-50" onMouseUp={(e) => handleInputPortMouseUp(e, node.id)} onMouseDown={(e) => e.stopPropagation()}><div className="w-1.5 h-1.5 bg-[#1e1e1e] rounded-full"></div></div><div className="w-4 h-4 bg-gray-700 border-2 border-[#1e1e1e] rounded-full -mr-6 flex items-center justify-center hover:bg-indigo-400 cursor-pointer transition-colors z-50" onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}><div className="w-1.5 h-1.5 bg-[#1e1e1e] rounded-full"></div></div></div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="h-8 bg-[#1a1a1a] border-t border-gray-800 flex items-center justify-between px-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest relative z-50">
        <div className="flex items-center gap-6"><span>Dataset: {dataset.name}</span><span>AI Mode: GEMINI FLASH</span><span>Status: READY</span></div>
        <div className="text-indigo-500/80">Kyros Intelligence &copy; 2025</div>
      </footer>
    </div>
  );
}
