import React from 'react'
import { apiClient, SystemSpecification, ModuleConfig, RunStatus } from '../api/client'
import { Card } from '../components/ui'
import toast from 'react-hot-toast'

type ModuleState = ModuleConfig & { paramsText?: string }

const emptyModule = (): ModuleState => ({ name: '', type: 'other', description: '', parameters: {}, paramsText: '{}' })

const GeneratePage: React.FC<{ onDone?: (runId: string) => void }> = ({ onDone }) => {
  const [running, setRunning] = React.useState(false)
  const [runId, setRunId] = React.useState<string | null>(null)
  const [runStatus, setRunStatus] = React.useState<RunStatus | null>(null)
  const pollRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [])

  const [projectName, setProjectName] = React.useState('Industrial Data Logger')
  const [mcu, setMcu] = React.useState('STM32L476')
  const [description, setDescription] = React.useState('')
  const [modules, setModules] = React.useState<ModuleState[]>([emptyModule()])
  const [requirementsText, setRequirementsText] = React.useState('')
  const [constraints, setConstraints] = React.useState({ max_flash: 0, max_ram: 0, clock_speed: 0, power_consumption: 0, operating_voltage: '' })
  const [constraintsText, setConstraintsText] = React.useState('')
  const [showAdvancedConstraints, setShowAdvancedConstraints] = React.useState(false)
  const [safetyCritical, setSafetyCritical] = React.useState(false)
  const [optimizationGoal, setOptimizationGoal] = React.useState<'balanced' | 'performance' | 'size'>('balanced')

  // model provider / Gemini option
  const [modelProvider, setModelProvider] = React.useState<'mock' | 'gemini'>('mock')
  const [architectureOnly, setArchitectureOnly] = React.useState(false)

  // module validation
  const [invalidModules, setInvalidModules] = React.useState<Record<number, string>>({})

  React.useEffect(() => {
    // try to prefill from previously saved requirements if present
    try {
      const raw = localStorage.getItem('forge_requirements')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.title) setProjectName(parsed.title)
        if (parsed?.requirements) setDescription(parsed.requirements)
      }
    } catch (err) {
      // ignore
    }
  }, [])

  const addModule = () => setModules((m) => [...m, emptyModule()])
  const removeModule = (i: number) => setModules((m) => m.filter((_, idx) => idx !== i))
  const updateModule = (i: number, patch: Partial<ModuleState>) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, ...patch } : mod)))

  const validateModules = React.useCallback(() => {
    const errors: Record<number, string> = {}
    modules.forEach((m, i) => {
      if (!m.name || m.name.trim().length === 0) {
        errors[i] = (errors[i] || '') + 'missing name'
      }
      if (m.paramsText) {
        try {
          JSON.parse(m.paramsText)
        } catch (err: any) {
          errors[i] = (errors[i] ? errors[i] + '; ' : '') + (err.message || 'invalid JSON')
        }
      }
    })
    setInvalidModules(errors)
    return Object.keys(errors).length === 0
  }, [modules])

  React.useEffect(() => { validateModules() }, [modules, validateModules])

  // import JSON file and populate form
  const handleImportJSON = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'))
        setProjectName(data.project_name || projectName)
        setMcu(data.target_platform || data.mcu || mcu)
        setDescription(data.description || '')
        setRequirementsText((data.requirements || []).join('\n'))
        setConstraints({
          max_flash: data.constraints?.max_flash || 0,
          max_ram: data.constraints?.max_ram || 0,
          clock_speed: data.constraints?.clock_speed || 0,
          power_consumption: data.constraints?.power_consumption || 0,
          operating_voltage: data.constraints?.operating_voltage || ''
        })
        setConstraintsText('')
        setSafetyCritical(Boolean(data.safety_critical))
        setOptimizationGoal(data.optimization_goal || 'balanced')
        if (Array.isArray(data.modules)) {
          setModules(data.modules.map((md: any) => ({
            name: md.name || '',
            type: md.type || 'other',
            description: md.description || '',
            parameters: md.parameters || {},
            paramsText: JSON.stringify(md.parameters || {}, null, 2)
          })))
        }
        toast.success('Imported JSON')
      } catch (err) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const buildSpecFromForm = (): SystemSpecification => ({
    project_name: projectName,
    mcu,
    description,
    modules: modules.map((m) => ({
      id: m.name ? m.name.toLowerCase().replace(/\s+/g, '_') : undefined,
      name: m.name,
      type: m.type,
      description: m.description,
      parameters: (() => {
        if (m.paramsText) {
          try { return JSON.parse(m.paramsText) } catch (_) { return m.parameters || {} }
        }
        return m.parameters || {}
      })()
    })),
    requirements: requirementsText.split('\n').map((r) => r.trim()).filter(Boolean),
    constraints: showAdvancedConstraints ? constraints : undefined,
    safety_critical: safetyCritical,
    optimization_goal: optimizationGoal,
    model_provider: modelProvider,
    architecture_only: architectureOnly
  })

  const handleGenerate = async () => {
    if (!validateModules()) {
      toast.error('Fix module errors before generating')
      return
    }

    const spec = buildSpecFromForm()
    // ensure model provider fields are explicitly set from current UI state
    spec.model_provider = modelProvider
    spec.model_name = undefined
    spec.api_key = undefined
    spec.architecture_only = architectureOnly

    try {
      setRunning(true)
      const res = await apiClient.generate(spec)
      setRunId(res.run_id)
      // record generated run id so Artifacts page can show only generated artifacts
      try {
        const prevRaw = localStorage.getItem('generated_runs') || '[]'
        const prev: string[] = JSON.parse(prevRaw)
        const next = [res.run_id, ...prev]
        // keep unique, preserve order, limit to 50
        const uniq = Array.from(new Set(next)).slice(0, 50)
        localStorage.setItem('generated_runs', JSON.stringify(uniq))
      } catch (err) {
        console.warn('failed to persist generated run id', err)
      }
      toast.success('Generation started')

      // start polling run status
      const poll = async () => {
        try {
          const status = await apiClient.getRunStatus(res.run_id)
          setRunStatus(status)
          if (status.status === 'completed' || status.status === 'failed') {
            if (pollRef.current) {
              window.clearInterval(pollRef.current)
              pollRef.current = null
            }
            // ask artifacts viewer to refresh
            try {
              window.dispatchEvent(new CustomEvent('artifact:refresh', { detail: { runId: res.run_id } }))
            } catch (e) {
              // older browsers
              const ev = document.createEvent('Event')
              ev.initEvent('artifact:refresh', true, true)
              window.dispatchEvent(ev)
            }
            if (status.status === 'completed') {
              toast.success('Generation completed')
              // call onDone when completed so parent can navigate
              if (onDone) onDone(res.run_id)
            } else {
              toast.error('Generation failed')
            }
            // stop loader once run finished
            setRunning(false)
          }
        } catch (err) {
          console.warn('poll error', err)
        }
      }
      // poll immediately then interval
      poll()
      pollRef.current = window.setInterval(poll, 2000)
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed')
      setRunning(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Generate Firmware</h2>
          <div className="flex items-center gap-2">
            <label className="px-2 py-1 rounded bg-transparent text-muted cursor-pointer">
              Import JSON
              <input type="file" accept="application/json" onChange={(e) => handleImportJSON(e.target.files ? e.target.files[0] : null)} className="hidden" />
            </label>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted">Project Name</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="input-base w-full mt-1 px-2 py-2 rounded" />
            </div>
            <div>
              <label className="text-sm text-muted">Target MCU</label>
              <select value={mcu} onChange={(e) => setMcu(e.target.value)} className="bg-gray-900 text-white border border-gray-700 w-full mt-1 px-2 py-2 rounded">
                <option value="STM32L476">STM32L476</option>
                <option value="Arduino Uno">Arduino Uno</option>
                <option value="ESP32">ESP32</option>
                <option value="nRF52840">nRF52840</option>
                <option value="PIC32MZ">PIC32MZ</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted">Optimization</label>
              <select value={optimizationGoal} onChange={(e) => setOptimizationGoal(e.target.value as any)} className="bg-gray-900 text-white border border-gray-700 w-full mt-1 px-2 py-2 rounded">
                <option value="balanced">Balanced</option>
                <option value="performance">Performance</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted">Model Provider</label>
              <select value={modelProvider} onChange={(e) => setModelProvider(e.target.value as any)} className="bg-gray-900 text-white border border-gray-700 w-full mt-1 px-2 py-2 rounded">
                <option value="mock">Mock (local)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-base w-full mt-1 px-2 py-2 rounded" />
          </div>

          <div>
            <label className="text-sm text-muted">Requirements (one per line)</label>
            <textarea value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} rows={4} className="input-base w-full mt-1 px-2 py-2 rounded font-mono" />
          </div>

          <div>
            <label className="text-sm text-muted">Modules</label>
            <div className="space-y-3 mt-2">
              {modules.map((mod, i) => (
                <div key={i} className="p-3 border rounded bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Module {i + 1}</div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => removeModule(i)} className="px-2 py-1 rounded bg-transparent text-muted">Remove</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input placeholder="Name" value={mod.name} onChange={(e) => updateModule(i, { name: e.target.value })} className="input-base p-2 rounded" />
                    <select value={mod.type} onChange={(e) => updateModule(i, { type: e.target.value })} className="bg-gray-900 text-white border border-gray-700 p-2 rounded">
                      <option value="uart">uart</option>
                      <option value="i2c">i2c</option>
                      <option value="spi">spi</option>
                      <option value="can">can</option>
                      <option value="ethernet">ethernet</option>
                      <option value="watchdog">watchdog</option>
                      <option value="eeprom">eeprom</option>
                      <option value="other">other</option>
                    </select>
                    <input placeholder="Description" value={mod.description} onChange={(e) => updateModule(i, { description: e.target.value })} className="input-base p-2 rounded" />
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-muted">Parameters (JSON)</label>
                    <textarea rows={6} value={mod.paramsText} onChange={(e) => updateModule(i, { paramsText: e.target.value })} className="input-base w-full mt-1 px-2 py-2 rounded font-mono" />
                    {invalidModules[i] && (
                      <div className="text-xs text-red-400 mt-1">{invalidModules[i]}</div>
                    )}
                  </div>
                </div>
              ))}
              <div>
                <button type="button" onClick={addModule} className="px-3 py-1 rounded bg-white text-black">Add Module</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted">Constraints (textual)</label>
            <textarea value={constraintsText} onChange={(e) => setConstraintsText(e.target.value)} rows={3} className="input-base w-full mt-1 px-2 py-2 rounded font-mono" placeholder="e.g. max_flash: 1MB\nmax_ram: 96KB\noperating_voltage: 24V ±10%" />
            <div className="mt-2">
              <button type="button" onClick={() => setShowAdvancedConstraints((s) => !s)} className="px-2 py-1 rounded bg-transparent text-muted">{showAdvancedConstraints ? 'Hide advanced' : 'Show advanced (numeric fields)'}</button>
            </div>
            {showAdvancedConstraints && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2">
                <input type="number" placeholder="max_flash" value={constraints.max_flash as any} onChange={(e) => setConstraints({ ...constraints, max_flash: Number(e.target.value) })} className="input-base p-2 rounded" />
                <input type="number" placeholder="max_ram" value={constraints.max_ram as any} onChange={(e) => setConstraints({ ...constraints, max_ram: Number(e.target.value) })} className="input-base p-2 rounded" />
                <input type="number" placeholder="clock_speed" value={constraints.clock_speed as any} onChange={(e) => setConstraints({ ...constraints, clock_speed: Number(e.target.value) })} className="input-base p-2 rounded" />
                <input type="number" placeholder="power_consumption" value={constraints.power_consumption as any} onChange={(e) => setConstraints({ ...constraints, power_consumption: Number(e.target.value) })} className="input-base p-2 rounded" />
                <input placeholder="operating_voltage" value={constraints.operating_voltage as any} onChange={(e) => setConstraints({ ...constraints, operating_voltage: e.target.value })} className="input-base p-2 rounded" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={safetyCritical} onChange={(e) => setSafetyCritical(e.target.checked)} /> Safety critical</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={architectureOnly} onChange={(e) => setArchitectureOnly(e.target.checked)} /> Architecture only</label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={
                running ||
                Object.keys(invalidModules).length > 0
              }
              className="px-3 py-1 rounded bg-white text-black"
            >
              {running ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {runId && (
            <div className="text-sm text-muted mt-2">
              Run: {runId} {runStatus ? `— ${runStatus.status}` : ''}
              {runStatus?.message && <span className="ml-2 text-xs">({runStatus.message})</span>}
            </div>
          )}
          {runStatus?.errors && runStatus.errors.length > 0 && (
            <div className="mt-3 p-3 rounded border border-red-500/40 bg-red-900/20 text-sm">
              <div className="font-medium text-red-200 mb-1">Generation Error</div>
              <div className="space-y-1">
                {runStatus.errors.map((err, idx) => (
                  <pre key={idx} className="whitespace-pre-wrap text-red-100">{err}</pre>
                ))}
              </div>
            </div>
          )}
        </form>
      </Card>
      {running && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-[#0a1929] p-8 rounded-lg border border-white/10">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <div className="text-white text-center">
              <div className="text-lg font-semibold mb-1">Generating Firmware...</div>
              {runStatus && (
                <div className="space-y-1">
                  <div className="text-sm text-muted">Status: {runStatus.status}</div>
                  {runStatus.message && <div className="text-xs text-muted">{runStatus.message}</div>}
                  <div className="w-64 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${runStatus.progress || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted">{runStatus.progress || 0}%</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratePage
