import React, { useEffect, useState } from 'react';
import { useWorkspace, WorkspaceView } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../types';
import { api } from '../../services/api';
import {
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  GitPullRequest,
  Wrench,
  Database,
  PlusCircle,
  Clock,
  Trash2,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, activeConversationId, setActiveConversationId, selectedPersona } = useWorkspace();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);

  const loadConversations = async () => {
    if (!user) return;
    try {
      setLoadingConv(true);
      const list = await api.getConversations(user.id);
      setConversations(list);
    } catch (e) {
      console.warn('Failed to load conversations', e);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, activeConversationId]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setCurrentView('chat');
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      setConversations((prev) => prev.filter((c) => c.conversation_id !== id));
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const navItems: Array<{ id: WorkspaceView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: GitPullRequest },
    { id: 'builder', label: 'Builder', icon: Wrench },
    { id: 'dataset_schema', label: 'Datasets', icon: Database }
  ];

  return (
    <aside className="w-60 bg-[#071321] border-r border-[#1b263c] flex flex-col justify-between shrink-0 select-none">
      {/* Top Section */}
      <div className="p-3 space-y-4">
        {/* New Chat Button (Doc Page 19, 29) */}
        <button
          type="button"
          onClick={handleNewChat}
          className="w-full py-2.5 px-3 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-red-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Navigation items (Doc Page 29, 30) */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] uppercase font-bold text-[#516c91] tracking-wider">
            Workspace Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1b263c] text-white font-semibold shadow-inner border border-[#344967]/50'
                    : 'text-[#8ba8d1] hover:text-white hover:bg-[#101a2d]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#d50072]' : 'text-[#516c91]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation History Section (Doc Page 19) */}
      <div className="flex-1 px-3 py-2 overflow-y-auto border-t border-[#1b263c]/60 min-h-0">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#516c91]" />
            History
          </span>
          <span className="text-[10px] text-[#516c91] font-mono">{conversations.length}</span>
        </div>

        <div className="space-y-1">
          {conversations.length === 0 ? (
            <div className="px-2 py-4 text-center text-[11px] text-[#516c91]">
              No past conversations
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.conversation_id;
              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => {
                    setActiveConversationId(conv.conversation_id);
                    setCurrentView('chat');
                  }}
                  className={`group px-2.5 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#101a2d] text-white font-medium border border-[#1b263c]'
                      : 'text-[#8ba8d1] hover:text-white hover:bg-[#101a2d]/60'
                  }`}
                >
                  <span className="truncate pr-1">{conv.title || 'Analytics Thread'}</span>
                  <button
                    type="button"
                    title="Delete Conversation"
                    onClick={(e) => handleDeleteConv(e, conv.conversation_id)}
                    className="opacity-0 group-hover:opacity-100 text-[#516c91] hover:text-[#ff0018] p-0.5 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Persona Focus Badge */}
      <div className="p-3 border-t border-[#1b263c] bg-[#050a12]/80">
        <div className="text-[10px] text-[#516c91] uppercase tracking-wider font-bold mb-1">
          Active Persona Scope
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">{selectedPersona?.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101a2d] text-[#00d8ff] border border-[#1b263c]">
            {selectedPersona?.role_visibility}
          </span>
        </div>
      </div>
    </aside>
  );
};
