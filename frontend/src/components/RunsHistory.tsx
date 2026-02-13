import React, { useEffect, useState } from 'react';
import { apiClient, RunLogs, RunStatus } from '../api/client';
import { Card, StatusBadge, ProgressBar } from './ui';
import toast from 'react-hot-toast';

export const RunsHistory: React.FC<{ onOpenRun?: (runId: string) => void }> = ({ onOpenRun }) => {
  const [runs, setRuns] = useState<RunStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [logsByRun, setLogsByRun] = useState<Record<string, RunLogs | null>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('RunsHistory mounted, loading runs...');
    loadRuns();
    const interval = setInterval(loadRuns, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRuns = async () => {
    try {
      console.log('Fetching runs from API...');
      const data = await apiClient.getRuns();
      console.log('Runs loaded:', data);
      setRuns(data);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load runs:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load runs';
      setError(errorMsg);
      toast.error('Error: ' + errorMsg);
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const toggleLogs = async (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);
    if (logsByRun[runId]) {
      return;
    }
    try {
      setLogsLoading(prev => ({ ...prev, [runId]: true }));
      const logs = await apiClient.getRunLogs(runId);
      setLogsByRun(prev => ({ ...prev, [runId]: logs }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load logs');
      setLogsByRun(prev => ({ ...prev, [runId]: null }));
    } finally {
      setLogsLoading(prev => ({ ...prev, [runId]: false }));
    }
  };

  const renderJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  if (loading) {
    return <div className="text-center py-12"><div className="text-lg font-semibold mb-2">Loading runs...</div><div className="text-sm text-gray-600">Fetching from API...</div></div>;
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <div className="text-center py-8">
          <div className="text-lg font-semibold text-red-900 mb-2">Error Loading Runs</div>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadRuns()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">No generation runs yet</div>
          <p className="text-sm">Start by creating a specification and clicking "Generate Firmware"</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => {
        console.log('Rendering run:', run);
        return (
          <Card key={run.run_id}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Run {run.run_id ? run.run_id.slice(0, 8) : 'Unknown'}</h3>
                  <p className="text-sm text-gray-600">
                    Created: {run.started_at ? formatDate(run.started_at) : 'Unknown'}
                  </p>
                </div>
                {run.status && <StatusBadge status={run.status as any} />}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {run.current_stage || 'Processing...'}
                  </span>
                  <span className="font-medium">{run.progress || 0}%</span>
                </div>
                <ProgressBar progress={run.progress || 0} />
              </div>

              {run.artifacts && (
                <div className="grid grid-cols-5 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {run.artifacts.architecture || 0}
                    </div>
                    <div className="text-xs text-gray-600">Architecture</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {run.artifacts.code || 0}
                    </div>
                    <div className="text-xs text-gray-600">Code</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {run.artifacts.tests || 0}
                    </div>
                    <div className="text-xs text-gray-600">Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {run.artifacts.build || 0}
                    </div>
                    <div className="text-xs text-gray-600">Build</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {run.artifacts.reports || 0}
                    </div>
                    <div className="text-xs text-gray-600">Reports</div>
                  </div>
                </div>
              )}

              {run.errors && run.errors.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">❌ Error: {run.errors[0]}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onOpenRun ? onOpenRun(run.run_id) : toggleLogs(run.run_id)}
                    className="text-sm text-white bg-black/70 px-3 py-1 rounded-md hover:bg-black/90"
                  >
                    Open Project
                  </button>

                  <button
                    onClick={() => toggleLogs(run.run_id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {expandedRunId === run.run_id ? 'Hide Logs' : 'View Build & Quality Logs'}
                  </button>
                </div>

                {expandedRunId === run.run_id && (
                  <div className="mt-3 space-y-4">
                    {logsLoading[run.run_id] && (
                      <div className="text-sm text-gray-500">Loading logs...</div>
                    )}

                    {!logsLoading[run.run_id] && logsByRun[run.run_id] && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 border rounded-md p-3">
                            <div className="font-semibold text-sm mb-2">Build Logs ({logsByRun[run.run_id]?.build_logs?.length || 0})</div>
                            {logsByRun[run.run_id]?.build_logs && logsByRun[run.run_id]!.build_logs.length > 0 ? (
                              <div className="space-y-2">
                                {logsByRun[run.run_id]!.build_logs.map((log, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded border text-xs">
                                    <div className="font-medium">{log.filename}</div>
                                    <div className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No build logs available yet.</div>
                            )}
                          </div>
                          <div className="bg-gray-50 border rounded-md p-3">
                            <div className="font-semibold text-sm mb-2">Quality Reports ({logsByRun[run.run_id]?.quality_reports?.length || 0})</div>
                            {logsByRun[run.run_id]?.quality_reports && logsByRun[run.run_id]!.quality_reports.length > 0 ? (
                              <div className="space-y-2">
                                {logsByRun[run.run_id]!.quality_reports.map((report, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded border text-xs">
                                    <div className="font-medium">{report.filename}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No quality reports available yet.</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
