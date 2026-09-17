import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Building2, UserCheck, Database, Check, ArrowRight, Sparkles, Layers, ShieldCheck, BarChart3 } from 'lucide-react';

export const WorkspaceSetup: React.FC = () => {
  const { user } = useAuth();
  const {
    businesses,
    personas,
    datasets,
    selectedBusiness,
    selectedPersona,
    selectedDataset,
    selectBusiness,
    selectPersona,
    selectDataset,
    completeSetup,
    isLoadingMetadata
  } = useWorkspace();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleNext = () => {
    if (step === 1 && selectedBusiness) setStep(2);
    else if (step === 2 && selectedPersona) setStep(3);
    else if (step === 3 && selectedDataset) {
      completeSetup();
    }
  };

  return (
    <div className="min-h-screen bg-[#050a12] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#e60000]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#9138da]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl bg-[#0b101c] border border-[#1b263c] rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Top Header */}
        <div className="border-b border-[#1b263c] pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-red-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-display">
                  Welcome, {user?.name || 'Analytics Leader'}
                </h1>
                <p className="text-xs text-[#8ba8d1]">Let's configure your analytics workspace.</p>
              </div>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${step === 1 ? 'bg-[#d50072]/20 text-[#d50072] border border-[#d50072]/40' : selectedBusiness ? 'text-[#28e98c] bg-emerald-950/40' : 'text-[#516c91]'}`}>
                <span>1. Business</span>
                {selectedBusiness && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="w-4 h-0.5 bg-[#1b263c]" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${step === 2 ? 'bg-[#d50072]/20 text-[#d50072] border border-[#d50072]/40' : selectedPersona ? 'text-[#28e98c] bg-emerald-950/40' : 'text-[#516c91]'}`}>
                <span>2. Persona</span>
                {selectedPersona && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="w-4 h-0.5 bg-[#1b263c]" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${step === 3 ? 'bg-[#d50072]/20 text-[#d50072] border border-[#d50072]/40' : selectedDataset ? 'text-[#28e98c] bg-emerald-950/40' : 'text-[#516c91]'}`}>
                <span>3. Dataset</span>
                {selectedDataset && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: BUSINESS SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                <Building2 className="w-5 h-5 text-[#e60000]" />
                Select Enterprise Business
              </h2>
              <p className="text-sm text-[#8ba8d1] mt-1">
                Choose the business entity for localized metrics, reporting currencies, and organizational data pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businesses.map((biz) => {
                const isSelected = selectedBusiness?.business_id === biz.business_id;
                return (
                  <div
                    key={biz.business_id}
                    onClick={() => selectBusiness(biz)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#1b263c] border-[#d50072] ring-2 ring-[#d50072]/40 shadow-xl'
                        : 'bg-[#101a2d] border-[#1b263c] hover:border-[#344967] hover:bg-[#1b263c]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#e60000]/20 text-[#ff0018] flex items-center justify-center font-bold">
                        VF
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#28e98c] text-[#050a12] flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{biz.business_name}</h3>
                    <p className="text-xs text-[#8ba8d1] leading-relaxed mb-3">{biz.description}</p>
                    <div className="text-[11px] text-[#516c91] font-mono bg-[#071321] px-2.5 py-1 rounded border border-[#1b263c]/50">
                      Source: {biz.data_source}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PERSONA SELECTION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                <UserCheck className="w-5 h-5 text-[#d50072]" />
                Select Your Persona
              </h2>
              <p className="text-sm text-[#8ba8d1] mt-1">
                The selected persona tunes AI analytical context, metric relevancy, and available dashboards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {personas.map((p) => {
                const isSelected = selectedPersona?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPersona(p)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1b263c] border-[#d50072] ring-2 ring-[#d50072]/40 shadow-xl'
                        : 'bg-[#101a2d] border-[#1b263c] hover:border-[#344967] hover:bg-[#1b263c]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#00d8ff]">
                          {p.role_visibility.replace('_', ' ')}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#28e98c] text-[#050a12] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mb-1.5">{p.name}</h3>
                      <p className="text-xs text-[#8ba8d1] leading-relaxed mb-3">{p.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[#1b263c]/60 flex flex-wrap gap-1">
                      {p.focus_areas.slice(0, 3).map((fa) => (
                        <span key={fa} className="text-[10px] bg-[#071321] text-[#8ba8d1] px-2 py-0.5 rounded border border-[#1b263c]">
                          {fa}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DATASET SELECTION (Doc Page 13-15) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                <Database className="w-5 h-5 text-[#00d8ff]" />
                Select BigQuery Dataset
              </h2>
              <p className="text-sm text-[#8ba8d1] mt-1">
                Connected Google Cloud BigQuery data source. Discovers schemas, tables, measures, and dimensions automatically.
              </p>
            </div>

            <div className="space-y-4">
              {datasets.map((ds) => {
                const isSelected = selectedDataset?.dataset_id === ds.dataset_id;
                return (
                  <div
                    key={ds.dataset_id}
                    onClick={() => selectDataset(ds)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b263c] border-[#00d8ff] ring-2 ring-[#00d8ff]/30 shadow-xl'
                        : 'bg-[#101a2d] border-[#1b263c] hover:border-[#344967]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00d8ff]/20 text-[#00d8ff] border border-[#00d8ff]/30">
                            BigQuery US
                          </span>
                          <span className="text-xs text-[#516c91] font-mono">
                            {ds.project_id}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{ds.name}</h3>
                      </div>

                      {isSelected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#28e98c]/20 text-[#28e98c] border border-[#28e98c]/40 text-xs font-semibold">
                          <Check className="w-4 h-4" /> Ready & Discovered
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#8ba8d1] leading-relaxed mb-4">
                      {ds.description}
                    </p>

                    {/* Metadata indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071321] p-3 rounded-xl border border-[#1b263c]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#516c91] block">Total Rows</span>
                        <span className="text-sm font-mono font-semibold text-white">{ds.rows.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#516c91] block">Columns</span>
                        <span className="text-sm font-mono font-semibold text-white">{ds.columns}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#516c91] block">Tables</span>
                        <span className="text-sm font-mono font-semibold text-white">{ds.tables.length} Tables</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#516c91] block">Last Updated</span>
                        <span className="text-xs font-mono text-[#8ba8d1] truncate block">{ds.last_updated}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 pt-2">
                      <span className="text-xs text-[#516c91] mr-1">Tables:</span>
                      {ds.tables.map(t => (
                        <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101a2d] text-[#8ba8d1] border border-[#1b263c]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-[#1b263c] flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8ba8d1] hover:text-white hover:bg-[#1b263c] transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={
                (step === 1 && !selectedBusiness) ||
                (step === 2 && !selectedPersona) ||
                (step === 3 && !selectedDataset) ||
                isLoadingMetadata
              }
              onClick={handleNext}
              className="py-2.5 px-6 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isLoadingMetadata ? (
                <span>Loading BigQuery Schema...</span>
              ) : step < 3 ? (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Enter Analytics AI</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
