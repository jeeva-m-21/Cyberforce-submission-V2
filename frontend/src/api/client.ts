import axios from 'axios';

// Types matching backend models
export interface ModuleConfig {
  id?: string;
  name: string;
  type: string;
  description?: string;
  parameters?: Record<string, any>;
  requirements?: string[];
}

export interface SystemSpecification {
  project_name: string;
  mcu: string;
  modules: ModuleConfig[];
  constraints?: Record<string, any>;
  description?: string;
  requirements?: string[];
  safety_critical?: boolean;
  optimization_goal?: string;
  model_provider?: string;
  model_name?: string;
  api_key?: string;
  architecture_only?: boolean;
}

export interface GenerationRequest {
  specification: SystemSpecification;
}

export interface RunStatus {
  run_id: string;
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  current_stage?: string;
  artifacts?: {
    architecture?: number;
    code?: number;
    tests?: number;
    build?: number;
    reports?: number;
  };
  errors?: string[];
  started_at?: string;
  completed_at?: string;
  output_dir?: string;
}

export interface BuildLog {
  filename: string;
  path: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface QualityReport {
  filename: string;
  path: string;
  data: Record<string, any>;
}

export interface RunLogs {
  run_id: string;
  output_dir: string;
  build_logs: BuildLog[];
  quality_reports: QualityReport[];
}

export interface ArtifactEntry {
  run_id: string;
  category: string;
  file_path: string;
  file_name: string;
  size: number;
  updated_at: string;
}

export interface Template {
  name: string;
  description: string;
  mcu: string;
  modules: ModuleConfig[];
}

export interface RAGDocument {
  title: string;
  content: string;
  category: string;
}

// API client
const getApiBaseUrl = () => {
  const stored = localStorage.getItem('apiBaseUrl');
  return stored && stored.trim().length > 0 ? stored.trim() : '/api';
};

// Axios interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
);

export const apiClient = {
  // Generate firmware
  async generate(specification: SystemSpecification): Promise<{ run_id: string }> {
    try {
      // Transform frontend spec to backend format
      const backendSpec = {
        project_name: specification.project_name,
        description: specification.description || 'No description provided',
        target_platform: specification.mcu, // Map mcu to target_platform
        modules: specification.modules.map((m: any) => ({
          id: m.id || m.name.toLowerCase().replace(/\s+/g, '_'), // Generate id from name if not provided
          name: m.name,
          description: m.description || m.name,
          type: m.type,
          requirements: m.requirements || [],
          parameters: (m as any).parameters || {}
        })),
        constraints: (specification as any).constraints || {},
        safety_critical: (specification as any).safety_critical || false,
        optimization_goal: (specification as any).optimization_goal || 'balanced'
      };
      
      console.log('Sending to /api/generate:', { specification: backendSpec });
      const requestBody: any = {
        specification: backendSpec,
        include_tests: true,
        include_docs: true,
        run_quality_checks: true,
        model_provider: specification.model_provider || 'mock',
        model_name: specification.model_name || '',
        architecture_only: specification.architecture_only || false,
      };
      // DEBUG: log provider and model name presence
      console.debug('Generate requestBody (debug):', { model_provider: requestBody.model_provider, model_name: requestBody.model_name });

      const response = await axios.post(`${getApiBaseUrl()}/generate`, requestBody);
      console.log('Generate response:', response.data);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? String(error.response.data.detail)
        : error.message || 'Unknown error';
      console.error('Generate error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  // Get all runs
  async getRuns(): Promise<RunStatus[]> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/runs`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch runs';
      console.error('GetRuns error:', errorMsg);
      throw new Error(String(errorMsg));
    }
  },

  // Get specific run status
  async getRunStatus(runId: string): Promise<RunStatus> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/runs/${runId}`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch run status';
      console.error('GetRunStatus error:', errorMsg);
      throw new Error(String(errorMsg));
    }
  },

  // Get latest build log and quality report for a run
  async getRunLogs(runId: string): Promise<RunLogs> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/runs/${runId}/logs`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch run logs';
      throw new Error(String(errorMsg));
    }
  },

  // Get templates
  async getTemplates(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/templates`);
      return response.data;
    } catch (error: any) {
      console.warn('Templates not available:', error.message);
      return {}; // Return empty object if templates fail
    }
  },

  // Get RAG documents
  async getRAGDocs(): Promise<RAGDocument[]> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/docs/rag`);
      return response.data;
    } catch (error: any) {
      console.warn('RAG docs not available:', error.message);
      return [];
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await axios.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error('Backend not reachable');
    }
  },

  // Get all artifacts
  async getArtifacts(): Promise<ArtifactEntry[]> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/artifacts`);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to load artifacts';
      throw new Error(String(errorMsg));
    }
  },

  // Get artifact content
  async getArtifactContent(runId: string, filePath: string): Promise<{ content: string }> {
    const response = await axios.get(`${getApiBaseUrl()}/output/${runId}/${filePath}`);
    return response.data;
  }
};
