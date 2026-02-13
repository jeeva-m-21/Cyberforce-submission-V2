import React from 'react'
import GeneratePage from './GeneratePage'
import ArtifactsListPage from './ArtifactsListPage'
import FileViewerPage from './FileViewerPage'
import BuildDeploymentPage from './BuildDeploymentPage'
import { ArtifactEntry } from '../api/client'
import '../App.css'

const TopNav: React.FC<{ current?: string; onNavigate?: (p: 'generate' | 'artifacts' | 'build') => void }> = ({ current = 'generate', onNavigate }) => {
  return (
    <header className="w-full py-3 px-6 flex items-center justify-between bg-page border-b border-var">
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">ForgeMCU Studio</div>
        <select className="bg-gray-900 text-white border border-gray-700 px-2 py-1 rounded text-sm">
          <option>Arduino Uno</option>
          <option>STM32</option>
          <option>ESP32</option>
        </select>
        <button onClick={() => onNavigate && onNavigate('generate')} className={`ml-3 px-3 py-1 rounded ${current === 'generate' ? 'bg-white text-black' : 'bg-transparent text-muted'}`}>
          Generate
        </button>
        <button onClick={() => onNavigate && onNavigate('artifacts')} className={`ml-1 px-3 py-1 rounded ${current === 'artifacts' ? 'bg-white text-black' : 'bg-transparent text-muted'}`}>
          Artifacts
        </button>
        <button onClick={() => onNavigate && onNavigate('build')} className={`ml-1 px-3 py-1 rounded ${current === 'build' ? 'bg-white text-black' : 'bg-transparent text-muted'}`}>
          Build & Deploy
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted">Build: Idle</div>
        <div className="text-sm text-muted">Flash 0 KB / 32 KB</div>
        <div className="text-sm text-muted">RAM 0 KB / 2 KB</div>
      </div>
    </header>
  )
}

const ForgeMCUPage: React.FC = () => {
  const [page, setPage] = React.useState<'generate' | 'artifacts' | 'build' | 'file-viewer'>('generate')
  const [selectedArtifact, setSelectedArtifact] = React.useState<ArtifactEntry | null>(null)
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null)

  const handleFileSelect = (artifact: ArtifactEntry) => {
    setSelectedArtifact(artifact)
    setPage('file-viewer')
  }

  const handleBackToArtifacts = () => {
    setSelectedArtifact(null)
    setPage('artifacts')
  }

  const handleGenerateDone = (runId: string) => {
    console.log('generate started', runId)
    setCurrentRunId(runId)
    setPage('build')
  }

  const handleBuildSelect = (runId: string) => {
    setCurrentRunId(runId)
    setPage('build')
  }

  const displayPage = page === 'file-viewer' ? 'artifacts' : page

  return (
    <div className="min-h-screen flex flex-col bg-page text-white">
      <TopNav current={displayPage} onNavigate={(p) => setPage(p)} />

      <main className="p-6 flex-1">
        {page === 'generate' && (
          <GeneratePage onDone={handleGenerateDone} />
        )}
        {page === 'artifacts' && (
          <ArtifactsListPage onFileSelect={handleFileSelect} onBuildSelect={handleBuildSelect} />
        )}
        {page === 'build' && (
          <BuildDeploymentPage runId={currentRunId} onBack={() => setPage('artifacts')} />
        )}
        {page === 'file-viewer' && selectedArtifact && (
          <FileViewerPage artifact={selectedArtifact} onBack={handleBackToArtifacts} />
        )}
      </main>
    </div>
  )
}

export default ForgeMCUPage
