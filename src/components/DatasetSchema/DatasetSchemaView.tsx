import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TableMetadata, ColumnMetadata } from '../../types';
import {
  Database,
  Table as TableIcon,
  Columns,
  Hash,
  Type,
  Calendar,
  Layers,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const DatasetSchemaView: React.FC = () => {
  const { selectedDataset, metadata, isLoadingMetadata } = useWorkspace();
  const [activeTableId, setActiveTableId] = useState<string>('customer_churn_and_revenue');

  const tables = metadata?.tables || [];
  const currentTable = tables.find((t: TableMetadata) => t.table_id === activeTableId) || tables[0];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'STRING':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00d8ff]/15 text-[#00d8ff] border border-[#00d8ff]/30">STRING</span>;
      case 'FLOAT':
      case 'INTEGER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#28e98c]/15 text-[#28e98c] border border-[#28e98c]/30">{type}</span>;
      case 'DATE':
      case 'TIMESTAMP':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffbe45]/15 text-[#ffbe45] border border-[#ffbe45]/30">{type}</span>;
      default:
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8ba8d1]/15 text-[#8ba8d1] border border-[#8ba8d1]/30">{type}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00d8ff]/20 border border-[#00d8ff]/40 flex items-center justify-center text-[#00d8ff]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">BigQuery Schema Discovery</h2>
            <p className="text-[11px] text-[#8ba8d1]">Automatic metadata discovery for dataset `{selectedDataset?.dataset_id}`</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8ba8d1] font-mono">
          <span className="hidden sm:inline">Location: US</span>
          <span className="px-2 py-0.5 rounded bg-[#101a2d] text-[#28e98c] border border-[#1b263c]">
            Schema Synced
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Table List */}
        <div className="w-72 bg-[#071321] border-r border-[#1b263c] p-4 overflow-y-auto shrink-0 space-y-2">
          <div className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider mb-2">
            Discovered Tables ({tables.length})
          </div>

          {tables.map((t: TableMetadata) => {
            const isSelected = activeTableId === t.table_id;
            return (
              <div
                key={t.table_id}
                onClick={() => setActiveTableId(t.table_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1b263c] border-[#00d8ff] text-white shadow-lg'
                    : 'bg-[#101a2d] border-[#1b263c] text-[#8ba8d1] hover:bg-[#101a2d]/80 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white truncate max-w-[170px]">
                    {t.table_id}
                  </span>
                  <TableIcon className="w-3.5 h-3.5 text-[#516c91]" />
                </div>
                <p className="text-[11px] text-[#516c91] line-clamp-2">{t.description}</p>
                <div className="mt-2 pt-2 border-t border-[#1b263c]/50 flex items-center justify-between text-[10px] text-[#516c91] font-mono">
                  <span>{t.columns?.length || 0} columns</span>
                  <span>{t.row_count?.toLocaleString()} rows</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Table Schema & Columns Inspector */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#050a12] space-y-6">
          {currentTable ? (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Table Info Header */}
              <div className="p-5 rounded-2xl bg-[#0b101c] border border-[#1b263c]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white font-display">{currentTable.table_name}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#101a2d] text-[#00d8ff] border border-[#1b263c]">
                      `vf-grp-gbissdbx-dev-1.KarthikRudrapati.{currentTable.table_id}`
                    </span>
                  </div>

                  <span className="text-xs font-mono text-[#516c91]">
                    Total Records: {currentTable.row_count?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#8ba8d1]">{currentTable.description}</p>
              </div>

              {/* Columns Table */}
              <div className="bg-[#0b101c] rounded-2xl border border-[#1b263c] overflow-hidden shadow-xl">
                <div className="px-5 py-3 border-b border-[#1b263c] bg-[#101a2d] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Columns className="w-4 h-4 text-[#d50072]" />
                    <span>Schema Columns ({currentTable.columns?.length})</span>
                  </span>
                  <span className="text-[11px] text-[#516c91]">Auto-discovered via BigQuery API</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#8ba8d1]">
                    <thead className="bg-[#071321] text-white uppercase text-[10px] font-bold tracking-wider border-b border-[#1b263c]">
                      <tr>
                        <th className="py-3 px-4">Column Name</th>
                        <th className="py-3 px-4">Data Type</th>
                        <th className="py-3 px-4">Analytics Role</th>
                        <th className="py-3 px-4">Nullable</th>
                        <th className="py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b263c]/50 font-mono text-[11px]">
                      {currentTable.columns?.map((c: ColumnMetadata) => (
                        <tr key={c.column} className="hover:bg-[#101a2d]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{c.column}</td>
                          <td className="py-3 px-4">{getTypeBadge(c.data_type)}</td>
                          <td className="py-3 px-4">
                            {c.is_dimension && (
                              <span className="text-[10px] text-[#00d8ff] font-sans font-semibold mr-2">
                                [Dimension]
                              </span>
                            )}
                            {c.is_measure && (
                              <span className="text-[10px] text-[#28e98c] font-sans font-semibold mr-2">
                                [Measure]
                              </span>
                            )}
                            {c.is_date && (
                              <span className="text-[10px] text-[#ffbe45] font-sans font-semibold">
                                [Date]
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#516c91]">{c.nullable ? 'YES' : 'NO'}</td>
                          <td className="py-3 px-4 font-sans text-xs text-slate-300">{c.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Rows Preview */}
              {currentTable.sample_rows && currentTable.sample_rows.length > 0 && (
                <div className="bg-[#0b101c] rounded-2xl border border-[#1b263c] p-4">
                  <span className="text-xs font-bold text-white block mb-3">
                    Sample Verified Rows (Read-Only Preview)
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-[#1b263c] bg-[#071321]">
                    <table className="w-full text-left text-xs text-[#8ba8d1]">
                      <thead className="bg-[#101a2d] text-white uppercase text-[10px] font-bold border-b border-[#1b263c]">
                        <tr>
                          {Object.keys(currentTable.sample_rows[0]).map((k) => (
                            <th key={k} className="py-2.5 px-3 font-mono">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1b263c]/50 font-mono text-[11px]">
                        {currentTable.sample_rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-[#101a2d]/40">
                            {Object.keys(currentTable.sample_rows[0]).map((k) => (
                              <td key={k} className="py-2 px-3 text-white">
                                {typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#516c91]">
              Select a table on the left to inspect its BigQuery schema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
