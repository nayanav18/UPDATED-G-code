import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Business, Persona, Dataset, DatasetFullMetadata } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type WorkspaceView = 'chat' | 'analysis' | 'dashboards' | 'pipeline' | 'builder' | 'dataset_schema';

interface WorkspaceContextType {
  businesses: Business[];
  personas: Persona[];
  datasets: Dataset[];
  selectedBusiness: Business | null;
  selectedPersona: Persona | null;
  selectedDataset: Dataset | null;
  metadata: DatasetFullMetadata | null;
  currentView: WorkspaceView;
  activeConversationId: string | null;
  isConfigured: boolean;
  isLoadingMetadata: boolean;
  metadataError: string | null;
  setCurrentView: (view: WorkspaceView) => void;
  setActiveConversationId: (id: string | null) => void;
  selectBusiness: (b: Business) => void;
  selectPersona: (p: Persona) => void;
  selectDataset: (d: Dataset) => Promise<void>;
  completeSetup: () => void;
  resetWorkspace: () => void;
  reloadMetadata: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [metadata, setMetadata] = useState<DatasetFullMetadata | null>(null);

  const [currentView, setCurrentView] = useState<WorkspaceView>('chat');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Load initial businesses, personas, datasets
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [bList, pList, dList] = await Promise.all([
          api.getBusinesses(),
          api.getPersonas(),
          api.getDatasets()
        ]);
        setBusinesses(bList);
        setPersonas(pList);
        setDatasets(dList);

        // Check if workspace was previously saved in localStorage (Rule 40, 48)
        const saved = localStorage.getItem('ea_workspace_config');
        if (saved && user) {
          const parsed = JSON.parse(saved);
          const foundB = bList.find(b => b.business_id === parsed.business_id) || bList[0];
          const foundP = pList.find(p => p.id === parsed.persona_id) || pList[0];
          const foundD = dList.find(d => d.dataset_id === parsed.dataset_id) || dList[0];

          setSelectedBusiness(foundB || null);
          setSelectedPersona(foundP || null);
          setSelectedDataset(foundD || null);

          if (foundD) {
            loadMetadataForDataset(foundD.dataset_id);
          }

          if (parsed.isConfigured) {
            setIsConfigured(true);
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial workspace data:', err);
      }
    }

    loadInitialData();
  }, [user]);

  const loadMetadataForDataset = async (datasetId: string) => {
    setIsLoadingMetadata(true);
    setMetadataError(null);
    try {
      const meta = await api.getDatasetMetadata(datasetId);
      setMetadata(meta);
    } catch (err: any) {
      setMetadataError(err.message || 'Failed to load BigQuery metadata');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const selectBusiness = (b: Business) => {
    setSelectedBusiness(b);
  };

  const selectPersona = (p: Persona) => {
    setSelectedPersona(p);
  };

  const selectDataset = async (d: Dataset) => {
    setSelectedDataset(d);
    await loadMetadataForDataset(d.dataset_id);
  };

  const completeSetup = () => {
    if (selectedBusiness && selectedPersona && selectedDataset) {
      setIsConfigured(true);
      localStorage.setItem('ea_workspace_config', JSON.stringify({
        business_id: selectedBusiness.business_id,
        persona_id: selectedPersona.id,
        dataset_id: selectedDataset.dataset_id,
        isConfigured: true
      }));
    }
  };

  const resetWorkspace = () => {
    setIsConfigured(false);
    localStorage.removeItem('ea_workspace_config');
  };

  const reloadMetadata = useCallback(async () => {
    if (selectedDataset) {
      await loadMetadataForDataset(selectedDataset.dataset_id);
    }
  }, [selectedDataset]);

  return (
    <WorkspaceContext.Provider
      value={{
        businesses,
        personas,
        datasets,
        selectedBusiness,
        selectedPersona,
        selectedDataset,
        metadata,
        currentView,
        activeConversationId,
        isConfigured,
        isLoadingMetadata,
        metadataError,
        setCurrentView,
        setActiveConversationId,
        selectBusiness,
        selectPersona,
        selectDataset,
        completeSetup,
        resetWorkspace,
        reloadMetadata
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
