import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { VisualConfig, Dashboard } from '../../types';
import { api } from '../../services/api';
import { VisualComponent } from '../Common/VisualComponent';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Table as TableIcon,
  Hash,
  Layers,
  Plus,
  Trash2,
  Copy,
  Save,
  Share2,
  Sliders,
  ChevronRight,
  Database,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const BuilderView: React.FC = () => {
  const { user } = useAuth();
  const { selectedBusiness, selectedPersona, selectedDataset, metadata, setCurrentView } = useWorkspace();

  const [dashboardName, setDashboardName] = useState('Enterprise Performance Overview');
  const [dashboardDescription, setDashboardDescription] = useState('Dynamic metrics dashboard configured for executive visibility.');
  const [visuals, setVisuals] = useState<VisualConfig[]>([]);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('customer_churn_and_revenue');

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'visuals' | 'fields' | 'properties'>('visuals');

  // Initialize initial visual cards if empty
  useEffect(() => {
    if (visuals.length === 0) {
      const initialCards: VisualConfig[] = [
        {
          visual_id: 'vis-1',
          type: 'bar',
          title: 'Regional Revenue Contribution',
          dimension: 'region',
          measure: 'revenue',
          aggregation: 'sum',
          table: 'customer_churn_and_revenue',
          position: { x: 0, y: 0 },
          width: 6,
          height: 300,
          formatting: { prefix: '€', showLegend: false }
        },
        {
          visual_id: 'vis-2',
          type: 'kpi_card',
          title: 'Active Subscribers Base',
          dimension: 'plan_code',
          measure: 'active_subscribers',
          aggregation: 'sum',
          table: 'product_adoption_and_arpu',
          position: { x: 6, y: 0 },
          width: 6,
          height: 300,
          formatting: { suffix: ' Lines' }
        }
      ];
      setVisuals(initialCards);
      setSelectedVisualId('vis-1');
    }
  }, []);

  const activeVisual = visuals.find((v) => v.visual_id === selectedVisualId) || visuals[0];

  // Visual Palette Types (Doc Page 26: Bar, Column, Line, Area, Pie, Donut, Scatter, Stacked Bar, Stacked Column, Table, KPI Card)
  const visualTypes: Array<{ type: VisualConfig['type']; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { type: 'bar', label: 'Bar', icon: BarChart3 },
    { type: 'column', label: 'Column', icon: BarChart3 },
    { type: 'line', label: 'Line', icon: LineIcon },
    { type: 'area', label: 'Area', icon: LineIcon },
    { type: 'pie', label: 'Pie', icon: PieIcon },
    { type: 'donut', label: 'Donut', icon: PieIcon },
    { type: 'scatter', label: 'Scatter', icon: Hash },
    { type: 'stacked_bar', label: 'Stacked Bar', icon: BarChart3 },
    { type: 'stacked_column', label: 'Stacked Col', icon: BarChart3 },
    { type: 'table', label: 'Table', icon: TableIcon },
    { type: 'kpi_card', label: 'KPI Card', icon: Hash }
  ];

  // Table options from BigQuery metadata
  const currentTableMeta = metadata?.tables?.find((t: any) => t.table_id === (activeVisual?.table || selectedTable)) || metadata?.tables?.[0];
  const dimensions = currentTableMeta?.columns?.filter((c: any) => c.is_dimension) || [];
  const measures = currentTableMeta?.columns?.filter((c: any) => c.is_measure) || [];

  // Add new visualization
  const handleAddVisual = (type: VisualConfig['type']) => {
    const newId = `vis-${Date.now()}`;
    const newVisual: VisualConfig = {
      visual_id: newId,
      type,
      title: `New ${type.toUpperCase()} Visual`,
      table: selectedTable,
      dimension: dimensions[0]?.column || 'region',
      measure: measures[0]?.column || 'revenue',
      aggregation: 'sum',
      position: { x: 0, y: visuals.length },
      width: 6,
      height: 280,
      formatting: { prefix: type === 'bar' ? '€' : '', showLegend: true }
    };
    setVisuals((prev) => [...prev, newVisual]);
    setSelectedVisualId(newId);
    setActiveTab('properties');
  };

  // Remove visualization
  const handleRemoveVisual = (id: string) => {
    setVisuals((prev) => prev.filter((v) => v.visual_id !== id));
    if (selectedVisualId === id) {
      setSelectedVisualId(visuals.find((v) => v.visual_id !== id)?.visual_id || null);
    }
  };

  // Duplicate visualization
  const handleDuplicateVisual = (v: VisualConfig) => {
    const dup: VisualConfig = {
      ...v,
      visual_id: `vis-${Date.now()}`,
      title: `${v.title} (Copy)`
    };
    setVisuals((prev) => [...prev, dup]);
    setSelectedVisualId(dup.visual_id);
  };

  // Toggle width between 6 (half) and 12 (full width)
  const handleToggleWidth = (id: string) => {
    setVisuals((prev) =>
      prev.map((v) => (v.visual_id === id ? { ...v, width: v.width === 12 ? 6 : 12 } : v))
    );
  };

  // Move visual up or down in order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visuals.length) return;
    const newArr = [...visuals];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setVisuals(newArr);
  };

  // Save dashboard to persistent database (Doc Page 28, 47)
  const handleSaveDashboard = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await api.createDashboard({
        name: dashboardName,
        description: dashboardDescription,
        user_id: user.id,
        business_id: selectedBusiness?.business_id || 'vf-ireland',
        persona_id: selectedPersona?.id || 'ceo',
        dataset_id: selectedDataset?.dataset_id || 'KarthikRudrapati',
        layout: 'grid',
        visuals
      });
      setSaveStatus('Dashboard saved successfully to enterprise database.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      setSaveStatus(`Save Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Query actual data for the active visual
  const [visualDataMap, setVisualDataMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    visuals.forEach(async (v) => {
      const tbl = v.table || 'customer_churn_and_revenue';
      try {
        const res = await api.queryTable(selectedDataset?.dataset_id || 'KarthikRudrapati', {
          table: tbl,
          dimension: v.dimension,
          measure: v.measure,
          aggregation: v.aggregation,
          limit: 10
        });
        setVisualDataMap((prev) => ({ ...prev, [v.visual_id]: res.rows }));
      } catch (err) {
        console.warn(`Query failed for visual ${v.visual_id}`, err);
      }
    });
  }, [visuals, selectedDataset]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d50072]/20 border border-[#d50072]/40 flex items-center justify-center text-[#d50072]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="font-bold text-white text-sm bg-transparent border-b border-transparent hover:border-[#344967] focus:border-[#d50072] focus:outline-none px-1"
            />
            <p className="text-[11px] text-[#8ba8d1] px-1">Power BI-Style Workspace Designer</p>
          </div>
        </div>

        {/* Save & Controls */}
        <div className="flex items-center gap-2.5">
          {saveStatus && (
            <span className="text-xs text-[#28e98c] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveDashboard}
            disabled={isSaving}
            className="py-2 px-3.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-red-500/20 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('dashboards')}
            className="py-2 px-3 rounded-xl bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-[#8ba8d1] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Dashboards</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Designer Grid: Canvas (Center-Left) + Power BI Tool Panels (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visuals Canvas Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#050a12]">
          <div className="max-w-6xl mx-auto space-y-4">
            {visuals.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-[#1b263c] rounded-2xl bg-[#0b101c]/40">
                <BarChart3 className="w-12 h-12 text-[#516c91] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Your dashboard is empty</h3>
                <p className="text-xs text-[#8ba8d1] mt-1 max-w-sm mx-auto">
                  Select a chart type from the Visualizations palette on the right to start building your enterprise report.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4">
                {visuals.map((v, index) => {
                  const isSelected = selectedVisualId === v.visual_id;
                  const data = visualDataMap[v.visual_id] || [];
                  const colSpan = v.width === 12 ? 'col-span-12' : 'col-span-12 lg:col-span-6';

                  return (
                    <div
                      key={v.visual_id}
                      onClick={() => {
                        setSelectedVisualId(v.visual_id);
                        setActiveTab('properties');
                      }}
                      className={`${colSpan} bg-[#0b101c] rounded-2xl border transition-all relative overflow-hidden flex flex-col ${
                        isSelected
                          ? 'border-[#d50072] ring-2 ring-[#d50072]/30 shadow-2xl'
                          : 'border-[#1b263c] hover:border-[#344967]'
                      }`}
                    >
                      {/* Visual Header */}
                      <div className="px-4 py-3 border-b border-[#1b263c] flex items-center justify-between bg-[#101a2d]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{v.title}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#071321] text-[#00d8ff] border border-[#1b263c]">
                            {v.type}
                          </span>
                        </div>

                        {/* Card Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Move Up"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveOrder(index, 'up');
                            }}
                            className="p-1 rounded text-[#516c91] hover:text-white hover:bg-[#1b263c]"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveOrder(index, 'down');
                            }}
                            className="p-1 rounded text-[#516c91] hover:text-white hover:bg-[#1b263c]"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Toggle Full Width"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWidth(v.visual_id);
                            }}
                            className="p-1 rounded text-[#516c91] hover:text-white hover:bg-[#1b263c]"
                          >
                            {v.width === 12 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            title="Duplicate Visual"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateVisual(v);
                            }}
                            className="p-1 rounded text-[#516c91] hover:text-white hover:bg-[#1b263c]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Remove Visual"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVisual(v.visual_id);
                            }}
                            className="p-1 rounded text-[#516c91] hover:text-[#ff0018] hover:bg-[#1b263c]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Visual Component Render */}
                      <div className="p-4 flex-1">
                        <VisualComponent config={v} data={data} height={240} />
                      </div>

                      {/* Footer Info */}
                      <div className="px-4 py-2 bg-[#071321] border-t border-[#1b263c]/50 text-[10px] text-[#516c91] flex items-center justify-between font-mono">
                        <span>Dim: {v.dimension || 'None'}</span>
                        <span>Meas: {v.aggregation || 'sum'}({v.measure || 'None'})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Power BI-Style Side Panels (Visualizations, Fields, Properties) */}
        <div className="w-80 bg-[#071321] border-l border-[#1b263c] flex flex-col shrink-0">
          {/* Panel Tabs */}
          <div className="flex border-b border-[#1b263c] bg-[#0b101c]">
            <button
              type="button"
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'visuals'
                  ? 'border-[#d50072] text-white bg-[#101a2d]'
                  : 'border-transparent text-[#8ba8d1] hover:text-white'
              }`}
            >
              Visuals
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'fields'
                  ? 'border-[#00d8ff] text-white bg-[#101a2d]'
                  : 'border-transparent text-[#8ba8d1] hover:text-white'
              }`}
            >
              Data Fields
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'properties'
                  ? 'border-[#28e98c] text-white bg-[#101a2d]'
                  : 'border-transparent text-[#8ba8d1] hover:text-white'
              }`}
            >
              Properties
            </button>
          </div>

          {/* TAB 1: VISUALIZATIONS PALETTE */}
          {activeTab === 'visuals' && (
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-2">
                  Add Visualization
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {visualTypes.map((vt) => {
                    const Icon = vt.icon;
                    return (
                      <button
                        key={vt.type}
                        type="button"
                        onClick={() => handleAddVisual(vt.type)}
                        className="p-2.5 rounded-xl bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] hover:border-[#344967] text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer group"
                      >
                        <Icon className="w-4 h-4 text-[#8ba8d1] group-hover:text-[#d50072]" />
                        <span className="text-[11px] text-[#8ba8d1] group-hover:text-white whitespace-nowrap font-medium">
                          {vt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table Selector */}
              <div className="pt-3 border-t border-[#1b263c]">
                <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1.5">
                  Target BigQuery Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d50072]"
                >
                  {metadata?.tables?.map((t: any) => (
                    <option key={t.table_id} value={t.table_id}>
                      {t.table_name || t.table_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: DATA / FIELDS PANEL */}
          {activeTab === 'fields' && (
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Database className="w-4 h-4 text-[#00d8ff]" />
                <span>{currentTableMeta?.table_name || 'Fields'}</span>
              </div>

              {/* Dimensions Section */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#00d8ff] tracking-wider block mb-1.5">
                  Dimensions (Categorical)
                </span>
                <div className="space-y-1">
                  {dimensions.map((col: any) => (
                    <div
                      key={col.column}
                      onClick={() => {
                        if (activeVisual) {
                          setVisuals((prev) =>
                            prev.map((v) =>
                              v.visual_id === activeVisual.visual_id ? { ...v, dimension: col.column } : v
                            )
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-xs flex items-center justify-between text-[#8ba8d1] hover:text-white cursor-pointer"
                    >
                      <span className="font-mono">{col.column}</span>
                      <span className="text-[10px] text-[#516c91]">{col.data_type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Measures Section */}
              <div className="pt-3 border-t border-[#1b263c]">
                <span className="text-[10px] uppercase font-bold text-[#28e98c] tracking-wider block mb-1.5">
                  Measures (Numeric / Aggregations)
                </span>
                <div className="space-y-1">
                  {measures.map((col: any) => (
                    <div
                      key={col.column}
                      onClick={() => {
                        if (activeVisual) {
                          setVisuals((prev) =>
                            prev.map((v) =>
                              v.visual_id === activeVisual.visual_id ? { ...v, measure: col.column } : v
                            )
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-xs flex items-center justify-between text-[#8ba8d1] hover:text-white cursor-pointer"
                    >
                      <span className="font-mono">{col.column}</span>
                      <span className="text-[10px] text-[#28e98c] font-mono">∑ {col.data_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROPERTIES PANEL */}
          {activeTab === 'properties' && (
            <div className="p-4 overflow-y-auto space-y-4">
              {activeVisual ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Visual Title
                    </label>
                    <input
                      type="text"
                      value={activeVisual.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVisuals((prev) =>
                          prev.map((v) => (v.visual_id === activeVisual.visual_id ? { ...v, title: val } : v))
                        );
                      }}
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d50072]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Chart Type
                    </label>
                    <select
                      value={activeVisual.type}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setVisuals((prev) =>
                          prev.map((v) => (v.visual_id === activeVisual.visual_id ? { ...v, type: val } : v))
                        );
                      }}
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d50072]"
                    >
                      {visualTypes.map((vt) => (
                        <option key={vt.type} value={vt.type}>
                          {vt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Dimension (X-Axis / Category)
                    </label>
                    <select
                      value={activeVisual.dimension}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVisuals((prev) =>
                          prev.map((v) => (v.visual_id === activeVisual.visual_id ? { ...v, dimension: val } : v))
                        );
                      }}
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d50072]"
                    >
                      {dimensions.map((col: any) => (
                        <option key={col.column} value={col.column}>
                          {col.column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Measure (Y-Axis / Value)
                    </label>
                    <select
                      value={activeVisual.measure}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVisuals((prev) =>
                          prev.map((v) => (v.visual_id === activeVisual.visual_id ? { ...v, measure: val } : v))
                        );
                      }}
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d50072]"
                    >
                      {measures.map((col: any) => (
                        <option key={col.column} value={col.column}>
                          {col.column}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Aggregation
                    </label>
                    <select
                      value={activeVisual.aggregation || 'sum'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setVisuals((prev) =>
                          prev.map((v) => (v.visual_id === activeVisual.visual_id ? { ...v, aggregation: val } : v))
                        );
                      }}
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-[#d50072]"
                    >
                      <option value="sum">SUM</option>
                      <option value="avg">AVERAGE (AVG)</option>
                      <option value="count">COUNT</option>
                      <option value="min">MIN</option>
                      <option value="max">MAX</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-1">
                      Prefix (e.g. € or $)
                    </label>
                    <input
                      type="text"
                      value={activeVisual.formatting?.prefix || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVisuals((prev) =>
                          prev.map((v) =>
                            v.visual_id === activeVisual.visual_id
                              ? { ...v, formatting: { ...v.formatting, prefix: val } }
                              : v
                          )
                        );
                      }}
                      placeholder="e.g. €"
                      className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d50072]"
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#516c91] text-center py-6">
                  Select a card on the canvas to configure properties.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
