import React from 'react'
import { RunsHistory } from './RunsHistory'
import { Card } from './ui'

export const Dashboard: React.FC<{ onOpenProject?: (runId: string) => void; onNewProject?: () => void }> = ({ onOpenProject, onNewProject }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects & Builds</h1>
          <p className="text-sm text-gray-400">Recent build runs and projects</p>
        </div>
        <div>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-white/8 text-white rounded-md hover:bg-white/12"
          >
            + New Project
          </button>
        </div>
      </div>

      <Card>
        <RunsHistory onOpenRun={onOpenProject} />
      </Card>
    </div>
  )
}

export default Dashboard
