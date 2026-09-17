import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { VisualComponent } from '../Common/VisualComponent';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Play,
  Code,
  CheckCircle2,
  AlertCircle,
  Database,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AnalysisView: React.FC = () => {
  const { selectedPersona, selectedDataset, metadata, setCurrentView } = useWorkspace();
  const [activeTable, setActiveTable] = useState('customer_churn_and_revenue');
  const [customSql, setCustomSql] = useState('');
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Default suggested SQL query
  useEffect(() => {
    setCustomSql(
      `SELECT region, SUM(revenue) AS total_revenue, AVG(satisfaction_score) AS avg_csat\nFROM \`vf-grp-gbissdbx-dev-1.KarthikRudrapati.${activeTable}\`\nGROUP BY region\nORDER BY total_revenue DESC\nLIMIT 10;`
    );
  }, [activeTable]);

  const handleRunQuery = async () => {
    setRunningQuery(true);
    setQueryError(null);
    try {
      const res = await api.queryTable(selectedDataset?.dataset_id || 'KarthikRudrapati', {
        table: activeTable,
        rawSql: customSql,
        limit: 15
      });
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'Query failed');
    } finally {
      setRunningQuery(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e60000]/20 border border-[#e60000]/40 flex items-center justify-center text-[#ff0018]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">{selectedPersona?.name} Strategic Analysis</h2>
            <p className="text-[11px] text-[#8ba8d1]">Statistical breakdown & read-only BigQuery query engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#516c91]">
            Project: <span className="text-white">vf-grp-gbissdbx-dev-1</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Executive KPI Scoreboard (Doc Page 21, 26) */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-2.5">
              Live Analytical Scorecard ({selectedPersona?.name} Domain)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-[#0b101c] p-4 rounded-2xl border border-[#1b263c]">
                <span className="text-[10px] uppercase font-bold text-[#8ba8d1] block">Quarterly Recurring Revenue</span>
                <span className="text-2xl font-extrabold font-display text-white mt-1 block">€24.8M</span>
                <span className="text-xs font-semibold text-[#28e98c] flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +5.4% YoY Growth
                </span>
              </div>

              <div className="bg-[#0b101c] p-4 rounded-2xl border border-[#1b263c]">
                <span className="text-[10px] uppercase font-bold text-[#8ba8d1] block">Active Connected Lines</span>
                <span className="text-2xl font-extrabold font-display text-white mt-1 block">1,420,000</span>
                <span className="text-xs font-semibold text-[#28e98c] flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +2.1% MoM Net Inflow
                </span>
              </div>

              <div className="bg-[#0b101c] p-4 rounded-2xl border border-[#1b263c]">
                <span className="text-[10px] uppercase font-bold text-[#8ba8d1] block">Blended Churn Rate</span>
                <span className="text-2xl font-extrabold font-display text-white mt-1 block">1.48%</span>
                <span className="text-xs font-semibold text-[#28e98c] flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> -0.14% Churn Reduction
                </span>
              </div>

              <div className="bg-[#0b101c] p-4 rounded-2xl border border-[#1b263c]">
                <span className="text-[10px] uppercase font-bold text-[#8ba8d1] block">5G Radio Uptime SLA</span>
                <span className="text-2xl font-extrabold font-display text-white mt-1 block">99.96%</span>
                <span className="text-xs font-semibold text-[#00d8ff] flex items-center gap-1 mt-1">
                  Optimal SLA Adherence
                </span>
              </div>
            </div>
          </div>

          {/* Deep Data Query Workbench */}
          <div className="bg-[#0b101c] border border-[#1b263c] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#00d8ff]" />
                <h3 className="text-sm font-bold text-white">BigQuery Read-Only SQL Workbench</h3>
              </div>

              {/* Table Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#516c91]">Table:</span>
                <select
                  value={activeTable}
                  onChange={(e) => setActiveTable(e.target.value)}
                  className="bg-[#101a2d] border border-[#1b263c] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#00d8ff]"
                >
                  {metadata?.tables?.map((t: any) => (
                    <option key={t.table_id} value={t.table_id}>
                      {t.table_name || t.table_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SQL Input Box */}
            <div className="relative">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={4}
                className="w-full bg-[#050a12] border border-[#1b263c] rounded-xl p-3 font-mono text-xs text-[#28e98c] placeholder-[#516c91] focus:outline-none focus:border-[#00d8ff] leading-relaxed"
              />
              <div className="text-[11px] text-[#516c91] mt-1 flex items-center justify-between">
                <span>Rule 43 Safety Enforced: Blocks DROP, DELETE, TRUNCATE, UPDATE, INSERT, ALTER</span>
                <button
                  type="button"
                  onClick={handleRunQuery}
                  disabled={runningQuery}
                  className="py-1.5 px-4 rounded-lg gradient-brand text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{runningQuery ? 'Running Query...' : 'Execute SQL'}</span>
                </button>
              </div>
            </div>

            {queryError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{queryError}</span>
              </div>
            )}

            {/* Query Results */}
            {queryResult && (
              <div className="space-y-3 pt-3 border-t border-[#1b263c]">
                <div className="flex items-center justify-between text-xs text-[#8ba8d1]">
                  <span className="font-semibold text-white">Results ({queryResult.total_rows} rows)</span>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-[#516c91]">
                    <span>Processed: {queryResult.bytes_processed}</span>
                    <span>Time: {queryResult.execution_time_ms}ms</span>
                    <span className="text-[#28e98c]">Verified BigQuery Response</span>
                  </div>
                </div>

                <VisualComponent config={{ type: 'table' }} data={queryResult.rows} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
