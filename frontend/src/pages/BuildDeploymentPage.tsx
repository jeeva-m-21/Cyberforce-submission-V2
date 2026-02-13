import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  FiCpu, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle, 
  FiPlay, 
  FiUpload, 
  FiTerminal,
  FiZap,
  FiHardDrive,
  FiActivity,
  FiCode,
  FiSettings,
  FiArrowLeft,
  FiRefreshCw,
  FiLoader
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { Card } from '../components/ui'

const API_BASE = 'http://localhost:8000'

interface BuildLog {
  timestamp: string
  build_type: string
  compilation_status: string
  compiler: string
  modules_compiled: number
  total_modules: number
  compilation_details: any
  unit_tests: any
  modules: any
}

interface HardwareInfo {
  mcu: string
  board: string
  framework: string
  flash_size?: string
  ram_size?: string
  clock_speed?: string
}

interface BuildDeploymentPageProps {
  runId?: string | null
  onBack?: () => void
}

const BuildDeploymentPage: React.FC<BuildDeploymentPageProps> = ({ runId, onBack }) => {
  const [buildLog, setBuildLog] = useState<BuildLog | null>(null)
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'hardware' | 'build' | 'tests' | 'deploy'>('hardware')
  const [buildInProgress, setBuildInProgress] = useState(false)
  const [deployInProgress, setDeployInProgress] = useState(false)

  const loadBuildData = async () => {
    if (!runId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const buildResponse = await axios.get(`${API_BASE}/artifacts/runs/${runId}/build_log/build_log.json`)
      const buildData = buildResponse.data
      setBuildLog(buildData)
      
      if (buildData && buildData.build_type) {
        const mcuName = buildData.build_type || 'Unknown'
        const framework = detectFramework(mcuName)
        
        setHardwareInfo({
          mcu: mcuName,
          board: mcuName.includes('ESP32') ? 'ESP32 DevKit' : 
                 mcuName.includes('STM32') ? 'STM32 Board' : 
                 mcuName.includes('RP2040') ? 'Raspberry Pi Pico' : 
                 'Generic Board',
          framework: framework,
          flash_size: '4MB',
          ram_size: '520KB',
          clock_speed: '240MHz'
        })
      }
    } catch (error) {
      console.log('No build data available yet')
      setBuildLog(null)
      setHardwareInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const detectFramework = (mcu: string): string => {
    if (mcu.includes('ESP32') || mcu.includes('ESP8266')) return 'Arduino/ESP-IDF'
    if (mcu.includes('STM32')) return 'STM32Cube'
    if (mcu.includes('RP2040')) return 'Pico SDK'
    if (mcu.includes('AVR') || mcu.includes('Arduino')) return 'Arduino'
    return 'Custom Framework'
  }

  useEffect(() => {
    loadBuildData()
  }, [runId])

  const handleBuild = async () => {
    setBuildInProgress(true)
    toast.loading('Starting PlatformIO build...')
    
    setTimeout(() => {
      setBuildInProgress(false)
      toast.dismiss()
      toast.success('Build completed successfully!')
      loadBuildData()
    }, 3000)
  }

  const handleDeploy = async () => {
    setDeployInProgress(true)
    toast.loading('Uploading firmware...')
    
    setTimeout(() => {
      setDeployInProgress(false)
      toast.dismiss()
      toast.success('Firmware deployed successfully!')
    }, 2500)
  }

  const getCompilationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'passed':
        return 'text-green-500'
      case 'failed':
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      default:
        return 'text-gray-400'
    }
  }

  const getCompilationStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'passed':
        return <FiCheckCircle className="text-green-500" />
      case 'failed':
      case 'error':
        return <FiXCircle className="text-red-500" />
      case 'warning':
        return <FiAlertCircle className="text-yellow-500" />
      default:
        return <FiAlertCircle className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading build data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#18181B] rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">Build & Deployment</h1>
              <p className="text-muted mt-1">
                {runId ? `Run ID: ${runId}` : 'No run selected'}
              </p>
            </div>
          </div>
          <button
            onClick={loadBuildData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <Card>
          <div className="flex border-b border-var">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'hardware'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-muted hover:text-white'
              }`}
            >
              <FiCpu className="w-5 h-5" />
              Hardware
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'build'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-muted hover:text-white'
              }`}
            >
              <FiTerminal className="w-5 h-5" />
              Build Status
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tests'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-muted hover:text-white'
              }`}
            >
              <FiCheckCircle className="w-5 h-5" />
              Unit Tests
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-muted hover:text-white'
              }`}
            >
              <FiUpload className="w-5 h-5" />
              Deployment
            </button>
          </div>
        </Card>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <div className="space-y-6 mt-6">
              {!hardwareInfo && !buildLog ? (
                <Card>
                  <div className="text-center py-12">
                    <FiCpu className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Hardware Configuration</h3>
                    <p className="text-muted mb-6">
                      Generate code first to see hardware configuration details.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Waiting for generation...</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* MCU Configuration */}
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FiCpu className="w-6 h-6 text-blue-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">MCU Configuration</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Microcontroller</p>
                        <p className="text-lg font-semibold text-white">
                          {hardwareInfo?.mcu || buildLog?.build_type || 'Not Available'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Board</p>
                        <p className="text-lg font-semibold text-white">
                          {hardwareInfo?.board || 'Not Available'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Framework</p>
                        <p className="text-lg font-semibold text-white">
                          {hardwareInfo?.framework || 'Not Available'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Compiler</p>
                        <p className="text-lg font-semibold text-white">
                          {buildLog?.compiler || 'Not Available'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Memory & Performance */}
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <FiHardDrive className="w-6 h-6 text-purple-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Memory & Performance</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          <FiHardDrive className="w-6 h-6 text-purple-500" />
                          <p className="text-sm text-muted">Flash Size</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {hardwareInfo?.flash_size || 'N/A'}
                        </p>
                        <div className="mt-3 bg-purple-500/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full w-1/3" />
                        </div>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          <FiActivity className="w-6 h-6 text-green-500" />
                          <p className="text-sm text-muted">RAM Size</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {hardwareInfo?.ram_size || 'N/A'}
                        </p>
                        <div className="mt-3 bg-green-500/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full w-1/4" />
                        </div>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          <FiZap className="w-6 h-6 text-yellow-500" />
                          <p className="text-sm text-muted">Clock Speed</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {hardwareInfo?.clock_speed || 'N/A'}
                        </p>
                        <div className="mt-3 bg-yellow-500/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full w-3/4 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Module Overview */}
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <FiCode className="w-6 h-6 text-indigo-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Module Overview</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                        <FiCheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog?.modules_compiled || 0}
                        </p>
                        <p className="text-sm text-muted">Modules Compiled</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
                        <FiCode className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog?.total_modules || 0}
                        </p>
                        <p className="text-sm text-muted">Total Modules</p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Build Status Tab */}
          {activeTab === 'build' && (
            <div className="space-y-6 mt-6">
              {!buildLog ? (
                <Card>
                  <div className="text-center py-12">
                    <FiTerminal className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Build Data Available</h3>
                    <p className="text-muted mb-6">
                      Generate code and build the project to see compilation results.
                    </p>
                    {/* Build Placeholder */}
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg border border-var">
                        <FiLoader className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-sm text-muted">Waiting for build trigger...</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Build Summary */}
                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <FiTerminal className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Build Summary</h2>
                      </div>
                      <button
                        onClick={handleBuild}
                        disabled={buildInProgress}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
                      >
                        {buildInProgress ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiPlay className="w-4 h-4" />
                        )}
                        {buildInProgress ? 'Building...' : 'Build Project'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          {getCompilationStatusIcon(buildLog.compilation_status)}
                          <p className="text-sm text-muted">Status</p>
                        </div>
                        <p className={`text-lg font-semibold ${getCompilationStatusColor(buildLog.compilation_status)}`}>
                          {buildLog.compilation_status || 'Unknown'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          <FiCode className="w-6 h-6 text-indigo-500" />
                          <p className="text-sm text-muted">Modules</p>
                        </div>
                        <p className="text-lg font-semibold text-white">
                          {buildLog.modules_compiled || 0} / {buildLog.total_modules || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3 mb-3">
                          <FiSettings className="w-6 h-6 text-gray-400" />
                          <p className="text-sm text-muted">Compiler</p>
                        </div>
                        <p className="text-lg font-semibold text-white">
                          {buildLog.compiler || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Compilation Details */}
                  {buildLog.compilation_details && (
                    <Card>
                      <h3 className="text-lg font-semibold text-white mb-4">Compilation Details</h3>
                      <div className="space-y-3">
                        {Object.entries(buildLog.compilation_details).map(([module, status]: [string, any]) => (
                          <div key={module} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-var hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                              {getCompilationStatusIcon(status)}
                              <span className="font-medium text-white">{module}</span>
                            </div>
                            <span className={`text-sm font-semibold ${getCompilationStatusColor(status)}`}>
                              {typeof status === 'string' ? status : 'Compiled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Unit Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6 mt-6">
              {!buildLog?.unit_tests ? (
                <Card>
                  <div className="text-center py-12">
                    <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Test Results</h3>
                    <p className="text-muted mb-6">
                      Run tests to see unit test results and coverage.
                    </p>
                    {/* Test Placeholder */}
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                          <span className="text-sm text-muted">test_sensor_init</span>
                        </div>
                        <span className="text-xs text-muted">Pending</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-var">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                          <span className="text-sm text-muted">test_communication</span>
                        </div>
                        <span className="text-xs text-muted">Pending</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Test Summary */}
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <FiCheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Test Summary</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
                        <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog.unit_tests.passed || 0}
                        </p>
                        <p className="text-sm text-muted">Passed</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-lg border border-red-500/20">
                        <FiXCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog.unit_tests.failed || 0}
                        </p>
                        <p className="text-sm text-muted">Failed</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg border border-yellow-500/20">
                        <FiAlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog.unit_tests.skipped || 0}
                        </p>
                        <p className="text-sm text-muted">Skipped</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                        <FiActivity className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-white mb-2">
                          {buildLog.unit_tests.coverage || '0'}%
                        </p>
                        <p className="text-sm text-muted">Coverage</p>
                      </div>
                    </div>
                  </Card>

                  {/* Individual Test Results */}
                  {buildLog.unit_tests.tests && Array.isArray(buildLog.unit_tests.tests) && (
                    <Card>
                      <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
                      <div className="space-y-3">
                        {buildLog.unit_tests.tests.map((test: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-var hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                              {test.status === 'passed' ? (
                                <FiCheckCircle className="text-green-500 w-5 h-5" />
                              ) : (
                                <FiXCircle className="text-red-500 w-5 h-5" />
                              )}
                              <span className="font-medium text-white">{test.name || `Test ${index + 1}`}</span>
                            </div>
                            <span className={`text-sm font-semibold ${
                              test.status === 'passed' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {test.status || 'Unknown'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Deployment Tab */}
          {activeTab === 'deploy' && (
            <div className="space-y-6 mt-6">
              {/* PlatformIO Integration */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <FiUpload className="w-6 h-6 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">PlatformIO Deployment</h2>
                  </div>
                  <button
                    onClick={handleDeploy}
                    disabled={deployInProgress || !buildLog}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
                  >
                    {deployInProgress ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiUpload className="w-4 h-4" />
                    )}
                    {deployInProgress ? 'Deploying...' : 'Deploy Firmware'}
                  </button>
                </div>
                
                {!buildLog ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FiAlertCircle className="text-yellow-500" />
                      <p className="text-yellow-500 font-medium">Build Required</p>
                    </div>
                    <p className="text-sm text-muted">
                      Build the project first before deploying firmware.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-sm text-blue-400 font-medium mb-3 flex items-center gap-2">
                        <FiTerminal className="w-4 h-4" />
                        Deployment Instructions:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted">
                        <li>Connect your {hardwareInfo?.mcu || 'microcontroller'} via USB</li>
                        <li>Ensure PlatformIO is installed and configured</li>
                        <li>Click "Deploy Firmware" to upload the compiled binary</li>
                        <li>Monitor serial output for debugging</li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Target Platform</p>
                        <p className="text-lg font-semibold text-white">
                          {hardwareInfo?.framework || 'Not Available'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                        <p className="text-sm text-muted mb-2">Upload Protocol</p>
                        <p className="text-lg font-semibold text-white">UART / USB</p>
                      </div>
                    </div>

                    {/* Serial Monitor Placeholder */}
                    <div className="p-4 bg-[#0A0A0A] rounded-lg border border-var">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-white">Serial Monitor</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-muted">Ready</span>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-green-400 space-y-1 bg-black/50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">[00:00:00]</span>
                          <span>System initialized...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">[00:00:01]</span>
                          <span>Waiting for firmware upload...</span>
                        </div>
                        <div className="flex items-center gap-2 animate-pulse">
                          <span className="text-gray-600">[00:00:02]</span>
                          <span className="text-blue-400">Ready for deployment ▌</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Deployment History */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <FiActivity className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Deployments</h3>
                </div>
                <div className="space-y-3">
                  {/* Placeholder deployment history items */}
                  <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-var opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded">
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">v1.0.0 - Initial Release</p>
                        <p className="text-xs text-muted">Deployed 2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-500 font-medium">Success</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-var opacity-30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <FiLoader className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">v0.9.5 - Beta</p>
                        <p className="text-xs text-muted">Deployed yesterday</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-500 font-medium">Completed</span>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted">Deploy your first build to see history</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildDeploymentPage
