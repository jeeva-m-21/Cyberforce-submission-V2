import { create } from 'zustand'
import { SystemSpecification, RunStatus } from '../api/client'

export interface GeneratorStore {
  specification: SystemSpecification
  setSpecification: (spec: SystemSpecification) => void
  updateModule: (index: number, module: any) => void
  addModule: (module: any) => void
  removeModule: (index: number) => void
  
  runs: RunStatus[]
  setRuns: (runs: RunStatus[]) => void
  addRun: (run: RunStatus) => void
  updateRun: (runId: string, run: RunStatus) => void
  
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useGeneratorStore = create<GeneratorStore>((set) => ({
  specification: {
    project_name: '',
    description: '',
    mcu: '',
    modules: [],
    constraints: {},
    requirements: [],
    safety_critical: false,
    optimization_goal: 'balanced',
    model_provider: 'mock',
    model_name: '',
    api_key: '',
    architecture_only: false
  },
  setSpecification: (spec) => set({ specification: spec }),
  updateModule: (index, module) =>
    set((state) => {
      if (!state.specification) return state
      const modules = [...state.specification.modules]
      modules[index] = module
      return {
        specification: { ...state.specification, modules },
      }
    }),
  addModule: (module) =>
    set((state) => {
      if (!state.specification) return state
      return {
        specification: {
          ...state.specification,
          modules: [...state.specification.modules, module],
        },
      }
    }),
  removeModule: (index) =>
    set((state) => {
      if (!state.specification) return state
      const modules = state.specification.modules.filter((_, i) => i !== index)
      return {
        specification: { ...state.specification, modules },
      }
    }),

  runs: [],
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  updateRun: (runId, run) =>
    set((state) => ({
      runs: state.runs.map((r) => (r.run_id === runId ? run : r)),
    })),

  loading: false,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),
}))
