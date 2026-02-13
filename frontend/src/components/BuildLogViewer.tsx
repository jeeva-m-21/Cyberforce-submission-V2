import React, { useEffect, useState, useRef } from 'react';
import { apiClient, RunLogs, RunStatus } from '../api/client';
import { Card } from './ui';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';

interface BuildLogViewerProps {
  runId?: string;
}

export const BuildLogViewer: React.FC<BuildLogViewerProps> = ({ runId }) => {
  const [logs, setLogs] = useState<RunLogs | null>(null);
  const [allRuns, setAllRuns] = useState<RunStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedBuildLogIndex, setSelectedBuildLogIndex] = useState<number>(0);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(runId);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedRunId(runId);
    if (runId) {
      loadLogs(runId);
    } else {
      loadAllRuns();
    }
  }, [runId]);

  const loadAllRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const runs = await apiClient.getRuns();
      setAllRuns(runs);
      
      // Load the latest completed run's logs
      const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'running');
      if (completedRuns.length > 0) {
        const latestRun = completedRuns[0];
        setSelectedRunId(latestRun.run_id);
        await loadLogs(latestRun.run_id);
      } else {
        setError('No runs available');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load runs');
      toast.error(err.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getRunLogs(id);
      setLogs(data);
      setSelectedBuildLogIndex(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load build logs');
      toast.error(err.message || 'Failed to load build logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelect = async (id: string) => {
    setSelectedRunId(id);
    await loadLogs(id);
  };

  const handleBuildLogSelect = (index: number) => {
    setSelectedBuildLogIndex(index);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <FiRefreshCw className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
          <p className="text-gray-600">Loading build logs...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <div className="text-center py-8">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => !runId ? loadAllRuns() : selectedRunId && loadLogs(selectedRunId)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!logs || !logs.build_logs || logs.build_logs.length === 0) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Build Logs</h2>
            {allRuns.length > 0 && (
              <div className="text-sm text-gray-600">
                {allRuns.length} run(s) available
              </div>
            )}
          </div>
          {allRuns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allRuns.map((run) => (
                <button
                  key={run.run_id}
                  onClick={() => handleRunSelect(run.run_id)}
                  className="p-3 rounded-lg text-left bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <div className="font-medium">{run.run_id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-600">Status: {run.status}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No build logs available</p>
              <p className="text-sm">Build logs will appear after firmware generation</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const selectedBuildLog = logs.build_logs[selectedBuildLogIndex];
  const buildLog = selectedBuildLog.data;

  return (
    <div className="space-y-6">
      {/* Run Selection and Build Log Selection */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Build Logs</h2>
            <button
              onClick={() => selectedRunId && loadLogs(selectedRunId)}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded-lg"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>

          {/* Select Run */}
          {allRuns.length > 1 && (
            <div className="space-y-2 pb-4 border-b">
              <label className="text-sm font-medium text-gray-700">Select Run:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {allRuns.map((run) => (
                  <button
                    key={run.run_id}
                    onClick={() => handleRunSelect(run.run_id)}
                    className={`p-2 rounded-lg text-left text-xs transition-all ${
                      selectedRunId === run.run_id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{run.run_id.slice(0, 8)}</div>
                    <div className="text-xs">Status: {run.status}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Build Log List */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Build Log:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {logs.build_logs.map((log, index) => (
                <button
                  key={index}
                  onClick={() => handleBuildLogSelect(index)}
                  className={`p-3 rounded-lg text-left transition-all border-2 ${
                    selectedBuildLogIndex === index
                      ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-semibold text-sm">{log.filename}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Build Status Summary */}
      <div ref={detailsRef}>
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Build Log Details</h2>
              <p className="text-sm text-gray-600">File: {selectedBuildLog.filename}</p>
              <p className="text-xs text-gray-500 mt-1">Generated: {new Date(selectedBuildLog.timestamp).toLocaleString()}</p>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(buildLog, null, 2), 'fullLog')}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1"
            >
              {copiedSection === 'fullLog' ? <FiCheck size={20} /> : <FiCopy size={20} />}
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 font-medium">Build Type</div>
              <div className="text-xl font-bold text-blue-700 mt-2">{buildLog.build_type || 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-600 font-medium">Status</div>
              <div className={`text-xl font-bold mt-2 ${buildLog.compilation_status === 'success' ? 'text-green-700' : 'text-orange-700'}`}>
                {buildLog.compilation_status || 'N/A'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-600 font-medium">Total Modules</div>
              <div className="text-xl font-bold text-purple-700 mt-2">{buildLog.total_modules || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-gray-600 font-medium">Compiled</div>
              <div className="text-xl font-bold text-orange-700 mt-2">{buildLog.modules_compiled || 0}</div>
            </div>
          </div>
        </div>
        </Card>
      </div>

      {/* Compilation Details */}
      <Card>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compilation Details</h3>
            <button
              onClick={() => copyToClipboard(JSON.stringify(buildLog.compilation_details, null, 2), 'compilation')}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              {copiedSection === 'compilation' ? <FiCheck size={18} /> : <FiCopy size={18} />}
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96 border border-gray-700">
{JSON.stringify(buildLog.compilation_details, null, 2)}
          </pre>
        </div>
      </Card>

      {/* Modules */}
      {buildLog.modules && Object.keys(buildLog.modules).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Compiled Modules ({Object.keys(buildLog.modules).length})</h3>
          <div className="space-y-3">
            {Object.entries(buildLog.modules).map(([moduleName, moduleData]: [string, any]) => (
              <div key={moduleName} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4">
                <div className="font-semibold text-sm mb-2 text-blue-900">{moduleName}</div>
                <pre className="text-xs bg-white p-3 rounded border border-blue-200 overflow-auto max-h-48 font-mono">
{JSON.stringify(moduleData, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unit Tests */}
      {buildLog.unit_tests && (
        <Card>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🧪 Unit Tests</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-gray-600">Status</div>
                <div className="text-2xl font-bold text-blue-700 mt-2">{buildLog.unit_tests.status || 'N/A'}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-xs font-medium text-gray-600">Passed</div>
                <div className="text-2xl font-bold text-green-700 mt-2">{buildLog.unit_tests.summary?.passed || 0}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-xs font-medium text-gray-600">Failed</div>
                <div className="text-2xl font-bold text-red-700 mt-2">{buildLog.unit_tests.summary?.failed || 0}</div>
              </div>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96 border border-gray-700 font-mono">
{JSON.stringify(buildLog.unit_tests, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Notes */}
      {buildLog.notes && buildLog.notes.length > 0 && (
        <Card className="border-l-4 border-yellow-400">
          <h3 className="text-lg font-semibold mb-4">📝 Build Notes</h3>
          <ul className="space-y-2">
            {buildLog.notes.map((note: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
