import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Building2,
  UserCheck,
  Database,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  Server,
  Layers
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    selectedBusiness,
    selectedPersona,
    selectedDataset,
    personas,
    selectPersona,
    resetWorkspace
  } = useWorkspace();

  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand Identity & Active Business */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-md shadow-red-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight hidden sm:inline font-display text-sm">
            Analytics AI
          </span>
        </div>

        <div className="h-5 w-px bg-[#1b263c]" />

        {/* Business Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101a2d] border border-[#1b263c] text-xs">
          <Building2 className="w-3.5 h-3.5 text-[#e60000]" />
          <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[160px]">
            {selectedBusiness?.business_name || 'Vodafone Ireland'}
          </span>
        </div>

        {/* Persona Selector Dropdown (Doc Page 9, 30) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] hover:border-[#344967] text-xs text-white transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#d50072]" />
            <span className="font-semibold">{selectedPersona?.name || 'CEO'}</span>
            <ChevronDown className="w-3 h-3 text-[#8ba8d1]" />
          </button>

          {personaMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-[#0b101c] border border-[#1b263c] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#516c91] border-b border-[#1b263c]">
                Switch Persona Context
              </div>
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    selectPersona(p);
                    setPersonaMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#1b263c] transition-colors ${
                    selectedPersona?.id === p.id ? 'text-[#d50072] font-semibold bg-[#1b263c]/50' : 'text-[#8ba8d1]'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] text-[#516c91] font-mono">{p.focus_areas[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BigQuery Dataset Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101a2d] border border-[#1b263c] text-xs">
          <Database className="w-3.5 h-3.5 text-[#00d8ff]" />
          <span className="font-mono text-[11px] text-[#8ba8d1] truncate max-w-[140px]">
            {selectedDataset?.dataset_id || 'KarthikRudrapati'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#28e98c] animate-pulse" />
        </div>
      </div>

      {/* Right: Technical Connectivity Status & User Profile */}
      <div className="flex items-center gap-3">
        {/* Real vs Fallback AI indicator (Rules 20, 50, 51) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#071321] border border-[#1b263c] text-[11px]">
          <Server className="w-3 h-3 text-[#28e98c]" />
          <span className="text-[#8ba8d1]">Engine:</span>
          <span className="font-mono font-medium text-white">
            {process.env.GEMINI_API_KEY ? 'gemini-2.5-flash-lite' : 'Development Fallback Mode'}
          </span>
        </div>

        {/* User Account / Logout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-xs text-white transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-[11px] font-bold text-white">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="font-medium hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
            <ChevronDown className="w-3 h-3 text-[#8ba8d1]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-[#0b101c] border border-[#1b263c] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-[#1b263c]">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-[#8ba8d1] truncate">{user?.email}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetWorkspace();
                  setUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#8ba8d1] hover:text-white hover:bg-[#1b263c] flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-[#00d8ff]" />
                <span>Switch Workspace / Setup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#ff0018] hover:bg-[#1b263c] flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
