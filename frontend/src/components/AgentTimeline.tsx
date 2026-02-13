import React from 'react'

export const AgentTimeline: React.FC<{events?: {time:string;msg:string}[]}> = ({ events = [] }) => {
  const sample = events.length ? events : [
    { time: '10:12:03', msg: 'Spec Agent parsed requirements' },
    { time: '10:12:05', msg: 'Code Agent generated LED module' },
    { time: '10:12:07', msg: 'Test Agent created 6 unit tests' },
    { time: '10:12:09', msg: 'Build Agent compiled successfully' }
  ]

  return (
    <div className="p-3 bg-surface rounded border border-var">
      <div className="font-medium mb-2">Agent Activity</div>
      <ul className="text-sm space-y-2">
        {sample.map((e, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-xs text-muted w-16">[{e.time}]</span>
            <span>{e.msg}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AgentTimeline
