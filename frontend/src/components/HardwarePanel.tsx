import React from 'react'

const HardwarePanel: React.FC = () => {
  const [connected, setConnected] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])

  const toggleConnect = () => {
    setConnected((s) => !s)
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${connected ? 'Disconnected' : 'Connected'}`])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Hardware</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLogs([])} className="px-2 py-1 rounded bg-transparent text-muted">Clear</button>
          <button onClick={toggleConnect} className={`px-3 py-1 rounded ${connected ? 'bg-white text-black' : 'bg-transparent text-muted'}`}>
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-surface p-3 rounded overflow-auto text-xs">
        {logs.length === 0 ? (
          <div className="text-muted">No serial data yet.</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="py-0.5">{l}</div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-white text-black">Flash</button>
        <button className="px-3 py-1 rounded bg-transparent text-muted">Reset</button>
      </div>
    </div>
  )
}

export default HardwarePanel
