import React from 'react'
import { apiClient } from '../api/client'
import { FiChevronDown } from 'react-icons/fi'
import { Card } from './ui'

export function Header() {
  const [apiHealth, setApiHealth] = React.useState<boolean | null>(null)
  const [darkMode, setDarkMode] = React.useState<boolean>(false)
  const [targetMCU, setTargetMCU] = React.useState<string>('Arduino Uno')
  const [buildStatus, setBuildStatus] = React.useState<'idle'|'success'|'failed'|'building'>('idle')
  const [flashUsage, setFlashUsage] = React.useState<{used:number;total:number}>({ used: 6400, total: 32768 })
  const [ramUsage, setRamUsage] = React.useState<{used:number;total:number}>({ used: 1024, total: 2048 })
  const [aiActive, setAiActive] = React.useState<boolean>(false)

  React.useEffect(() => {
    checkApi()
    const interval = setInterval(checkApi, 10000)
    return () => clearInterval(interval)
  }, [])

  // Poll runs to detect AI activity and build status
  React.useEffect(() => {
    let mounted = true
    const poll = async () => {
      try {
        const runs = await apiClient.getRuns()
        if (!mounted) return
        const anyRunning = runs.some(r => r.status === 'running' || r.status === 'pending')
        setAiActive(anyRunning)

        if (runs.length > 0) {
          const latest = runs[0]
          if (latest.status === 'running' || latest.status === 'pending') setBuildStatus('building')
          else if (latest.status === 'completed') setBuildStatus('success')
          else if (latest.status === 'failed') setBuildStatus('failed')
          // try to reflect basic sizes if available
          if ((latest as any).flash_used) {
            setFlashUsage({ used: (latest as any).flash_used, total: (latest as any).flash_total || flashUsage.total })
          }
          if ((latest as any).ram_used) {
            setRamUsage({ used: (latest as any).ram_used, total: (latest as any).ram_total || ramUsage.total })
          }
        }
      } catch (e) {
        // ignore
      }
    }

    poll()
    const t = setInterval(poll, 3000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  React.useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const enabled = saved ? saved === 'dark' : prefersDark
    setDarkMode(enabled)
    document.documentElement.classList.toggle('dark', enabled)
  }, [])

  const checkApi = async () => {
    try {
      const res = await fetch('http://localhost:8000/health')
      setApiHealth(res.ok)
    } catch {
      setApiHealth(false)
    }
  }

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <header className="surface border-b border-var sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Project + MCU selector */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold">ForgeMCU Studio</h1>
            <p className="text-xs text-muted">AI-Assisted Firmware</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Target:</label>
            <select
              value={targetMCU}
              onChange={(e) => setTargetMCU(e.target.value)}
              className="bg-transparent border rounded px-2 py-1 text-sm"
            >
              <option>Arduino Uno</option>
              <option>STM32</option>
              <option>ESP32</option>
              <option>Custom</option>
            </select>
          </div>
        </div>

        {/* Center: Build status + memory bars */}
        <div className="flex-1 px-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${buildStatus === 'success' ? 'bg-green-500' : buildStatus === 'failed' ? 'bg-red-500' : buildStatus === 'building' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
              <div className="text-sm font-medium">Build: {buildStatus}</div>
            </div>

            <div className="w-48">
              <div className="text-xs text-muted">Flash</div>
              <div className="bg-gray-200 rounded h-3 mt-1 overflow-hidden">
                <div className="bg-blue-500 h-3" style={{ width: `${(flashUsage.used/flashUsage.total)*100}%` }} />
              </div>
            </div>

            <div className="w-48">
              <div className="text-xs text-muted">RAM</div>
              <div className="bg-gray-200 rounded h-3 mt-1 overflow-hidden">
                <div className="bg-indigo-500 h-3" style={{ width: `${(ramUsage.used/ramUsage.total)*100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Connected board, AI activity, settings */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div className="font-medium">Board: <span className="text-muted">Uno</span></div>
            <div className="text-xs text-muted">Port: COM3</div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${aiActive ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'}`} />
            <div className="text-sm text-muted">AI</div>
          </div>

          <div>
            <button onClick={toggleTheme} className="px-3 py-1 text-sm rounded-full border border-var text-muted">{darkMode ? '🌙' : '☀️'}</button>
          </div>
        </div>
      </div>
    </header>
  )
}

interface TabsProps {
  tabs: { label: string; value: string }[]
  activeTab: string
  onTabChange: (tab: any) => void
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-var gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === tab.value
              ? 'border-black text-black'
              : 'border-transparent text-muted hover:text-black'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
