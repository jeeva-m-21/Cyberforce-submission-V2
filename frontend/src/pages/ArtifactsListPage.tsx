import React, { useEffect, useMemo, useState } from 'react'
import { apiClient, ArtifactEntry } from '../api/client'
import { Card } from '../components/ui'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiFolder, FiFile, FiClock, FiZap } from 'react-icons/fi'

interface ArtifactsListPageProps {
  onFileSelect: (artifact: ArtifactEntry) => void
  onBuildSelect?: (runId: string) => void
}

export const ArtifactsListPage: React.FC<ArtifactsListPageProps> = ({ onFileSelect, onBuildSelect }) => {
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const loadArtifacts = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getArtifacts()

      // Get generated runs from localStorage
      let generatedRuns: string[] = []
      try {
        const raw = localStorage.getItem('generated_runs') || '[]'
        generatedRuns = JSON.parse(raw)
      } catch (err) {
        generatedRuns = []
      }

      const filtered = Array.isArray(data)
        ? data.filter((d) => generatedRuns.includes(d.run_id))
        : []

      setArtifacts(filtered)
      const uniqCats = Array.from(new Set(filtered.map((d) => d.category)))
      setCategories(uniqCats)
    } catch (err: any) {
      toast.error('Failed to load artifacts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArtifacts()

    const onRefresh = (_e?: Event) => {
      loadArtifacts()
    }
    window.addEventListener('artifact:refresh', onRefresh as EventListener)

    return () => {
      window.removeEventListener('artifact:refresh', onRefresh as EventListener)
    }
  }, [])

  const filtered = useMemo(() => {
    return artifacts.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      return true
    })
  }, [artifacts, categoryFilter])

  // Group artifacts by run_id for better organization
  const groupedByRun = useMemo(() => {
    const groups: Record<string, ArtifactEntry[]> = {}
    filtered.forEach((artifact) => {
      if (!groups[artifact.run_id]) {
        groups[artifact.run_id] = []
      }
      groups[artifact.run_id].push(artifact)
    })
    return groups
  }, [filtered])

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Generated Artifacts</h2>
            <p className="text-sm text-muted mt-1">Browse and view all generated firmware files</p>
          </div>
          <button
            onClick={loadArtifacts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mb-6">
          <label className="text-sm text-muted mb-2 block">Filter by Category</label>
          <select
            className="w-64 px-3 py-2 border rounded-lg input-base"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories ({artifacts.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({artifacts.filter((a) => a.category === c).length})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByRun).length === 0 && (
            <div className="text-center py-12 text-muted">
              <FiFolder className="mx-auto text-5xl mb-4 opacity-20" />
              <p className="text-lg">No generated artifacts found.</p>
              <p className="text-sm mt-2">Generate firmware from the Generate page to see artifacts here.</p>
            </div>
          )}

          {Object.entries(groupedByRun).map(([runId, runArtifacts]) => (
            <div key={runId}>
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-var">
                <FiFolder className="text-blue-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Run: {runId.slice(0, 8)}</h3>
                  <p className="text-xs text-muted">{runArtifacts.length} files</p>
                </div>
                {runArtifacts[0]?.updated_at && (
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <FiClock />
                    {new Date(runArtifacts[0].updated_at).toLocaleString()}
                  </div>
                )}
                {onBuildSelect && (
                  <button
                    onClick={() => onBuildSelect(runId)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                  >
                    <FiZap size={14} />
                    Build Status
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                {runArtifacts.map((artifact) => (
                  <button
                    key={`${artifact.run_id}-${artifact.file_path}`}
                    onClick={() => onFileSelect(artifact)}
                    className="flex items-start gap-3 p-4 rounded-lg border border-transparent hover:border-white/20 hover:bg-white/5 transition-all text-left group"
                  >
                    <FiFile className="text-green-400 mt-1 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-white transition-colors">
                        {artifact.file_name}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        <span className="bg-white/10 px-2 py-0.5 rounded">{artifact.category}</span>
                      </div>
                      <div className="text-xs text-muted mt-1 truncate">{artifact.file_path}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ArtifactsListPage
