import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PipelineItem } from '../../types';
import { api } from '../../services/api';
import {
  GitPullRequest,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Target,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const PipelineView: React.FC = () => {
  const { selectedPersona, selectedDataset, personas } = useWorkspace();

  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Doc Page 22-23, 48)
  const [filterPersona, setFilterPersona] = useState<string>('All');
  const [filterBusinessArea, setFilterBusinessArea] = useState<string>('All');
  const [filterDataset, setFilterDataset] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const businessAreas = [
    'All',
    'Revenue',
    'Customers',
    'Marketing',
    'Products',
    'Offers',
    'Operations',
    'Pipeline',
    'Retention'
  ];

  const statuses = ['All', 'active', 'in_review', 'planned', 'completed'];

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.getPipeline({
        persona: filterPersona,
        business_area: filterBusinessArea,
        dataset_id: filterDataset,
        status: filterStatus
      });
      setPipelineItems(res.items);
    } catch (err) {
      console.error('Failed to load pipeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, [filterPersona, filterBusinessArea, filterDataset, filterStatus]);

  const getStatusBadge = (status: PipelineItem['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#28e98c]/15 text-[#28e98c] border border-[#28e98c]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28e98c] animate-pulse" />
            Active
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00d8ff]/15 text-[#00d8ff] border border-[#00d8ff]/30">
            <Clock className="w-3 h-3" />
            In Review
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ffbe45]/15 text-[#ffbe45] border border-[#ffbe45]/30">
            Planned
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d50072]/15 text-[#d50072] border border-[#d50072]/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#28e98c]/20 border border-[#28e98c]/40 flex items-center justify-center text-[#28e98c]">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Enterprise Analytics Pipeline</h2>
            <p className="text-[11px] text-[#8ba8d1]">Organization-wide strategic initiative tracking and execution metrics</p>
          </div>
        </div>

        <div className="text-xs text-[#8ba8d1] flex items-center gap-2">
          <span>Viewing as:</span>
          <span className="px-2 py-0.5 rounded bg-[#101a2d] text-white font-semibold border border-[#1b263c]">
            {selectedPersona?.name}
          </span>
        </div>
      </div>

      {/* Multi-Factor Filter Bar (Doc Page 22-23, 48) */}
      <div className="p-4 bg-[#071321] border-b border-[#1b263c] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#8ba8d1] font-bold mr-1">
          <Filter className="w-3.5 h-3.5 text-[#d50072]" />
          <span>Filters:</span>
        </div>

        {/* Persona Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] uppercase font-bold text-[#516c91]">Persona:</label>
          <select
            value={filterPersona}
            onChange={(e) => setFilterPersona(e.target.value)}
            className="bg-[#101a2d] border border-[#1b263c] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#d50072]"
          >
            <option value="All">All Personas</option>
            {personas.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Business Area Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] uppercase font-bold text-[#516c91]">Area:</label>
          <select
            value={filterBusinessArea}
            onChange={(e) => setFilterBusinessArea(e.target.value)}
            className="bg-[#101a2d] border border-[#1b263c] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#d50072]"
          >
            {businessAreas.map((ba) => (
              <option key={ba} value={ba}>
                {ba}
              </option>
            ))}
          </select>
        </div>

        {/* Dataset Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] uppercase font-bold text-[#516c91]">Dataset:</label>
          <select
            value={filterDataset}
            onChange={(e) => setFilterDataset(e.target.value)}
            className="bg-[#101a2d] border border-[#1b263c] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#d50072]"
          >
            <option value="All">All Datasets</option>
            <option value="KarthikRudrapati">KarthikRudrapati</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] uppercase font-bold text-[#516c91]">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#101a2d] border border-[#1b263c] rounded-lg px-2.5 py-1 text-xs text-white uppercase focus:outline-none focus:border-[#d50072]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {(filterPersona !== 'All' || filterBusinessArea !== 'All' || filterDataset !== 'All' || filterStatus !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setFilterPersona('All');
              setFilterBusinessArea('All');
              setFilterDataset('All');
              setFilterStatus('All');
            }}
            className="text-[11px] text-[#ff0018] hover:underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Pipeline Items Grid */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#050a12]">
        <div className="max-w-5xl mx-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#516c91]">Loading pipeline items from database...</div>
          ) : pipelineItems.length === 0 ? (
            <div className="p-12 text-center border border-[#1b263c] rounded-2xl bg-[#0b101c]">
              <GitPullRequest className="w-8 h-8 text-[#516c91] mx-auto mb-2" />
              <p className="text-xs text-[#8ba8d1]">No pipeline items match the active filters.</p>
            </div>
          ) : (
            pipelineItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0b101c] border border-[#1b263c] hover:border-[#344967] rounded-2xl p-5 shadow-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white tracking-tight">{item.name}</span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101a2d] text-[#8ba8d1] border border-[#1b263c]">
                      Persona: {item.persona}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101a2d] text-[#00d8ff] border border-[#1b263c]">
                      Area: {item.business_area}
                    </span>
                    <span className="text-[10px] text-[#516c91] font-mono">{item.date}</span>
                  </div>
                </div>

                <p className="text-xs text-[#8ba8d1] leading-relaxed mb-4">{item.details}</p>

                {/* Progress / Metric Target Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#071321] p-3 rounded-xl border border-[#1b263c]">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#ff0018] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#516c91] block">KPI Target</span>
                      <span className="text-xs font-bold text-white">{item.metric_target}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#28e98c] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#516c91] block">Current Achievement</span>
                      <span className="text-xs font-bold text-[#28e98c]">{item.metric_current}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
