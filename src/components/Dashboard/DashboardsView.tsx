import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Dashboard } from '../../types';
import { api } from '../../services/api';
import { VisualComponent } from '../Common/VisualComponent';
import {
  LayoutDashboard,
  Share2,
  Edit,
  Trash2,
  Plus,
  Users,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';

export const DashboardsView: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentView } = useWorkspace();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Sharing Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'viewer' | 'editor'>('viewer');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sharesList, setSharesList] = useState<any[]>([]);

  const loadDashboards = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await api.getDashboards(user.id, user.email);
      setDashboards(list);
      if (list.length > 0 && !activeDashboard) {
        setActiveDashboard(list[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, [user]);

  const handleOpenShare = async (dash: Dashboard) => {
    setActiveDashboard(dash);
    setShareMessage(null);
    setShareEmail('');
    try {
      const details = await api.getDashboardDetails(dash.dashboard_id);
      setSharesList(details.shares || []);
    } catch (e) {
      console.warn('Failed to load shares', e);
    }
    setShareModalOpen(true);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDashboard || !shareEmail) return;
    setShareLoading(true);
    setShareMessage(null);
    try {
      const res = await api.shareDashboard(activeDashboard.dashboard_id, {
        email: shareEmail,
        permission: sharePermission,
        shared_by: user?.email || 'owner'
      });
      setSharesList((prev) => [...prev, res]);
      setShareMessage(`Successfully shared with ${shareEmail} as ${sharePermission}.`);
      setShareEmail('');
    } catch (err: any) {
      setShareMessage(`Share Error: ${err.message}`);
    } finally {
      setShareLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await api.deleteDashboard(id);
      setDashboards((prev) => prev.filter((d) => d.dashboard_id !== id));
      if (activeDashboard?.dashboard_id === id) {
        setActiveDashboard(null);
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-[#0b101c] border-b border-[#1b263c] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#9138da]/20 border border-[#9138da]/40 flex items-center justify-center text-[#9138da]">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Enterprise Dashboards</h2>
            <p className="text-[11px] text-[#8ba8d1]">Saved reports & cross-organizational shared views</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentView('builder')}
          className="py-2 px-3.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-red-500/20 hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create In Builder</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Dashboards Selector List */}
        <div className="w-72 bg-[#071321] border-r border-[#1b263c] p-4 overflow-y-auto shrink-0 space-y-2">
          <div className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider mb-2">
            Available Dashboards ({dashboards.length})
          </div>

          {loading ? (
            <div className="text-xs text-[#516c91] py-4 text-center">Loading dashboards...</div>
          ) : dashboards.length === 0 ? (
            <div className="p-4 rounded-xl border border-[#1b263c] bg-[#101a2d] text-center text-xs text-[#8ba8d1]">
              No saved dashboards yet. Build one using the Power BI-Style Builder!
            </div>
          ) : (
            dashboards.map((dash) => {
              const isSelected = activeDashboard?.dashboard_id === dash.dashboard_id;
              return (
                <div
                  key={dash.dashboard_id}
                  onClick={() => setActiveDashboard(dash)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1b263c] border-[#9138da] text-white shadow-lg'
                      : 'bg-[#101a2d] border-[#1b263c] text-[#8ba8d1] hover:bg-[#101a2d]/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{dash.name}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        dash.user_permission === 'owner'
                          ? 'bg-[#e60000]/20 text-[#ff0018] border-[#e60000]/40'
                          : dash.user_permission === 'editor'
                          ? 'bg-[#00d8ff]/20 text-[#00d8ff] border-[#00d8ff]/40'
                          : 'bg-[#516c91]/20 text-[#8ba8d1] border-[#516c91]/40'
                      }`}
                    >
                      {dash.user_permission || 'viewer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#516c91] line-clamp-2">{dash.description || 'No description provided'}</p>
                  <div className="mt-2 pt-2 border-t border-[#1b263c]/50 flex items-center justify-between text-[10px] text-[#516c91]">
                    <span>{dash.visuals?.length || 0} visuals</span>
                    <span>{new Date(dash.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Dashboard Canvas View */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#050a12]">
          {activeDashboard ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Dashboard Details Header */}
              <div className="p-5 rounded-2xl bg-[#0b101c] border border-[#1b263c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white font-display">{activeDashboard.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101a2d] text-[#00d8ff] border border-[#1b263c]">
                      Dataset: {activeDashboard.dataset_id}
                    </span>
                  </div>
                  <p className="text-xs text-[#8ba8d1]">{activeDashboard.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenShare(activeDashboard)}
                    className="py-2 px-3 rounded-xl bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#00d8ff]" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentView('builder')}
                    className="py-2 px-3 rounded-xl bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#28e98c]" />
                    <span>Edit in Builder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(activeDashboard.dashboard_id)}
                    className="p-2 rounded-xl bg-[#101a2d] hover:bg-[#1b263c] border border-[#1b263c] text-[#516c91] hover:text-[#ff0018] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visuals Grid */}
              <div className="grid grid-cols-12 gap-4">
                {activeDashboard.visuals?.map((v) => {
                  const colSpan = v.width === 12 ? 'col-span-12' : 'col-span-12 lg:col-span-6';
                  return (
                    <div
                      key={v.visual_id}
                      className={`${colSpan} bg-[#0b101c] rounded-2xl border border-[#1b263c] p-4 flex flex-col`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">{v.title}</span>
                        <span className="text-[10px] font-mono text-[#516c91] uppercase">{v.type}</span>
                      </div>
                      <div className="flex-1">
                        <VisualComponent config={v} height={240} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#516c91]">
              Select a dashboard on the left to view metrics.
            </div>
          )}
        </div>
      </div>

      {/* Sharing Modal (Doc Page 28-29) */}
      {shareModalOpen && activeDashboard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0b101c] border border-[#1b263c] rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="absolute right-4 top-4 text-[#516c91] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Share Dashboard</h3>
                <p className="text-xs text-[#8ba8d1] truncate max-w-[260px]">{activeDashboard.name}</p>
              </div>
            </div>

            {shareMessage && (
              <div className="mb-4 p-3 bg-[#101a2d] border border-[#1b263c] rounded-xl text-xs text-[#28e98c] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{shareMessage}</span>
              </div>
            )}

            <form onSubmit={handleShareSubmit} className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
                  Colleague Email
                </label>
                <input
                  type="email"
                  required
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="analyst@vodafone.ie"
                  className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
                  Permission Level
                </label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as any)}
                  className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d50072]"
                >
                  <option value="viewer">Viewer (View only)</option>
                  <option value="editor">Editor (View, modify, and save changes)</option>
                </select>
                <p className="text-[10px] text-[#516c91] mt-1">
                  Enforced by backend ACL security: Editors can update visuals; Viewers are read-only.
                </p>
              </div>

              <button
                type="submit"
                disabled={shareLoading || !shareEmail}
                className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-red-500/20 hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {shareLoading ? 'Sharing...' : '[ Share ]'}
              </button>
            </form>

            {/* Current Access List */}
            <div className="pt-3 border-t border-[#1b263c]">
              <span className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-2">
                Users With Access
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#101a2d]">
                  <span className="text-white font-medium truncate">{user?.email} (You)</span>
                  <span className="text-[10px] font-bold text-[#ff0018]">Owner</span>
                </div>
                {sharesList.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#101a2d]">
                    <span className="text-[#8ba8d1] truncate">{s.email}</span>
                    <span className="text-[10px] uppercase font-bold text-[#00d8ff]">{s.permission}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
