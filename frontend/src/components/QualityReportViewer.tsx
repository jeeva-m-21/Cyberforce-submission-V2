import React, { useEffect, useState } from 'react';
import { apiClient, RunLogs, RunStatus } from '../api/client';
import { Card } from './ui';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCopy, FiCheck, FiTrendingUp } from 'react-icons/fi';

interface QualityReportViewerProps {
  runId?: string;
}

export const QualityReportViewer: React.FC<QualityReportViewerProps> = ({ runId }) => {
  const [logs, setLogs] = useState<RunLogs | null>(null);
  const [allRuns, setAllRuns] = useState<RunStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(runId);

  useEffect(() => {
    setSelectedRunId(runId);
    if (runId) {
      loadReports(runId);
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
      
      // Load the latest completed run's reports
      const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'running');
      if (completedRuns.length > 0) {
        const latestRun = completedRuns[0];
        setSelectedRunId(latestRun.run_id);
        await loadReports(latestRun.run_id);
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

  const loadReports = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getRunLogs(id);
      setLogs(data);
      setSelectedReportIndex(0); // Default to latest report
    } catch (err: any) {
      setError(err.message || 'Failed to load quality reports');
      toast.error(err.message || 'Failed to load quality reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelect = async (id: string) => {
    setSelectedRunId(id);
    await loadReports(id);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getStatusColor = (status: string) => {
    if (status === 'pass') return 'text-green-700 bg-green-50';
    if (status === 'warning') return 'text-orange-700 bg-orange-50';
    return 'text-red-700 bg-red-50';
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <FiRefreshCw className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
          <p className="text-gray-600">Loading quality reports...</p>
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
            onClick={() => !runId ? loadAllRuns() : selectedRunId && loadReports(selectedRunId)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!logs || !logs.quality_reports || logs.quality_reports.length === 0) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quality Reports</h2>
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
              <p className="text-lg mb-2">No quality reports available</p>
              <p className="text-sm">Quality reports will appear after firmware generation</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const qualityReports = logs.quality_reports;
  const report = qualityReports[selectedReportIndex].data;
  const reportFilename = qualityReports[selectedReportIndex].filename;

  return (
    <div className="space-y-6">
      {/* Run and Report Selector */}
      <Card>
        <div className="space-y-4">
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

          {/* Select Report */}
          {qualityReports.length > 1 && (
            <div className="space-y-2 pb-4 border-b">
              <label className="text-sm font-medium text-gray-700">Select Report ({qualityReports.length}):</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {qualityReports.map((qr, idx) => {
                  // Format filename for display
                  let displayName = qr.filename;
                  let displayTime = '';
                  
                  if (qr.filename === 'quality_report_latest.json') {
                displayName = '⭐ Latest Report';
                displayTime = 'Current';
              } else {
                // Extract timestamp from filename: YYYYMMDDTHHMMSSZ_...
                const match = qr.filename.match(/^(\d{8}T\d{6}Z)/);
                if (match) {
                  const timestamp = match[1];
                  const formattedTime = new Date(
                    timestamp.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
                  ).toLocaleString();
                  displayTime = formattedTime;
                }
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedReportIndex(idx)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    idx === selectedReportIndex
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white hover:bg-purple-100 text-gray-700'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{displayName}</div>
                  {displayTime && <div className="text-xs opacity-75">{displayTime}</div>}
                  <div className="text-sm font-bold mt-2">
                    Score: {qr.data.overall_score || 'N/A'}
                  </div>
                </button>
              );
            })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Code Quality Report</h2>
            <p className="text-sm text-gray-600">File: {reportFilename}</p>
            <p className="text-xs text-gray-500 mt-1">Generated: {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'N/A'}</p>
          </div>
          <button
            onClick={() => selectedRunId ? loadReports(selectedRunId) : runId ? loadReports(runId) : loadAllRuns()}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
          >
            <FiRefreshCw size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Overall Score</span>
              <FiTrendingUp className="text-blue-600" size={20} />
            </div>
            <div className="text-4xl font-bold text-blue-700">{report.overall_score || 0}</div>
            <div className="text-sm text-gray-500 mt-2">out of 100</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-3">Key Metrics</div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Modules Analyzed</span>
                <span className="font-bold">{report.analysis_summary?.modules_analyzed || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Tests Found</span>
                <span className="font-bold">{report.analysis_summary?.test_files_found || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Lines of Code</span>
                <span className="font-bold">{report.analysis_summary?.total_lines || 0}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-3">Report Type</div>
            <p className="text-sm text-gray-700 mb-4">{report.report_type || 'N/A'}</p>
            <div className="text-xs text-gray-500">Focus: {report.focus || 'Current project'}</div>
          </div>
        </div>
      </Card>

      {/* Detailed Metrics */}
      {report.metrics && Object.keys(report.metrics).length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Detailed Metrics</h3>
            <button
              onClick={() => copyToClipboard(JSON.stringify(report.metrics, null, 2), 'metrics')}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              {copiedSection === 'metrics' ? <FiCheck size={18} /> : <FiCopy size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.metrics).map(([metricName, metricData]: [string, any]) => (
              <div key={metricName} className={`p-4 rounded-lg border ${getStatusColor(metricData.status || 'warning')}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm capitalize">{metricName.replace(/_/g, ' ')}</div>
                    <div className="text-xs opacity-75 mt-1">Value: {metricData.value} {metricData.unit ? metricData.unit : ''}</div>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-1 bg-white rounded">
                    {metricData.status || 'unknown'}
                  </span>
                </div>
                {metricData.target && (
                  <div className="text-xs opacity-75">Target: {metricData.target}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-3">
            {report.recommendations.map((recommendation: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span>
                <span className="text-sm text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Analysis Summary */}
      {report.analysis_summary && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-xs text-gray-600">Modules Analyzed</div>
              <div className="text-2xl font-bold text-blue-700">{report.analysis_summary.modules_analyzed}</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-xs text-gray-600">Test Files Found</div>
              <div className="text-2xl font-bold text-green-700">{report.analysis_summary.test_files_found}</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-xs text-gray-600">Total Lines of Code</div>
              <div className="text-2xl font-bold text-purple-700">{report.analysis_summary.total_lines}</div>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="text-xs text-gray-600">Report Type</div>
              <div className="text-sm font-bold text-orange-700">{report.report_type}</div>
            </div>
          </div>
          {report.analysis_summary.llm_analysis_excerpt && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="text-xs text-gray-600 mb-2">LLM Analysis Excerpt</div>
              <p className="text-sm text-gray-700">{report.analysis_summary.llm_analysis_excerpt}</p>
            </div>
          )}
        </Card>
      )}

      {/* Notes */}
      {report.notes && report.notes.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <ul className="space-y-2">
            {report.notes.map((note: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 font-bold mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Full JSON Export */}
      <Card>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Full Report (JSON)</h3>
            <button
              onClick={() => copyToClipboard(JSON.stringify(report, null, 2), 'fullreport')}
              className="p-2 text-blue-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              {copiedSection === 'fullreport' ? <FiCheck size={18} /> : <FiCopy size={18} />}
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-80">
{JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};
