import React, { useEffect, useState } from 'react';
import { apiClient, RunLogs } from '../api/client';
import { Card } from './ui';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiZap } from 'react-icons/fi';

interface ResultsSummaryProps {
  runId: string;
  onViewArtifacts?: () => void;
  onViewBuildLog?: () => void;
  onViewQualityReport?: () => void;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  runId,
  onViewArtifacts,
  onViewBuildLog,
  onViewQualityReport,
}) => {
  const [logs, setLogs] = useState<RunLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [runId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getRunLogs(runId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
      toast.error(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <FiRefreshCw className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
          <p className="text-gray-600">Loading generation results...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <div className="text-center py-8">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadResults}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const buildLog = logs?.build_logs ? logs.build_logs[0] : undefined;
  const qualityReports = logs?.quality_reports || [];
  const latestQualityReport = qualityReports.length > 0 ? qualityReports[0].data : null;

  // Determine overall success status
  const buildSuccess = (buildLog as any)?.data?.compilation_status === 'success';
  const qualityScore = latestQualityReport?.overall_score || 0;
  const qualityPass = qualityScore >= 75;

  return (
    <div className="space-y-6">
      {/* Main Success Banner */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">Generation Successful</h1>
            <p className="text-sm text-muted mb-4">Your firmware has been generated; components compiled and tested.</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onViewArtifacts}
                className="px-4 py-2 bg-white text-black rounded-full font-medium"
              >
                View Generated Files
              </button>
              <button
                onClick={onViewBuildLog}
                className="px-4 py-2 bg-transparent border border-var text-muted rounded-md font-medium"
              >
                View Build Report
              </button>
              <button
                onClick={onViewQualityReport}
                className="px-4 py-2 bg-transparent border border-var text-muted rounded-md font-medium"
              >
                View Quality Metrics
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Build Results Summary */}
      {buildLog && (
        <Card>
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {buildSuccess ? (
                <FiCheckCircle className="text-green-600" size={28} />
              ) : (
                <FiAlertCircle className="text-orange-600" size={28} />
              )}
              Build Report
            </h2>
            <button
              onClick={onViewBuildLog}
              className="text-sm text-muted hover:text-white font-medium"
            >
              View Full Report →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg border border-var bg-surface">
              <div className="text-sm text-muted mb-1">Build Status</div>
              <div className={`text-lg font-bold ${buildSuccess ? 'text-green-400' : 'text-orange-400'}`}>
                {(buildLog as any)?.data?.compilation_status || 'Unknown'}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-var bg-surface">
              <div className="text-sm text-muted mb-1">Total Modules</div>
              <div className="text-lg font-bold text-muted">{(buildLog as any)?.data?.total_modules || 0}</div>
            </div>

            <div className="p-4 rounded-lg border border-var bg-surface">
              <div className="text-sm text-muted mb-1">Compiled</div>
              <div className="text-lg font-bold text-muted">{(buildLog as any)?.data?.modules_compiled || 0}</div>
            </div>

            <div className="p-4 rounded-lg border border-var bg-surface">
              <div className="text-sm text-muted mb-1">Build Type</div>
              <div className="text-sm font-bold text-muted">{(buildLog as any)?.data?.build_type || 'N/A'}</div>
            </div>
          </div>

          {/* Unit Tests Summary */}
          {(buildLog as any)?.data?.unit_tests && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FiZap className="text-blue-600" size={20} />
                Unit Tests
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-lg font-bold text-blue-700">{(buildLog as any)?.data?.unit_tests?.status || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Passed</div>
                  <div className="text-lg font-bold text-green-700">{(buildLog as any)?.data?.unit_tests?.summary?.passed || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="text-lg font-bold text-red-700">{(buildLog as any)?.data?.unit_tests?.summary?.failed || 0}</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quality Report Summary */}
      {latestQualityReport && (
        <Card>
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {qualityPass ? (
                <FiCheckCircle className="text-green-600" size={28} />
              ) : (
                <FiAlertCircle className="text-orange-600" size={28} />
              )}
              Code Quality Analysis
              {qualityReports.length > 1 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({qualityReports.length} reports available)
                </span>
              )}
            </h2>
            <button
              onClick={onViewQualityReport}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Report →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-300 flex items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">Overall Quality Score</div>
                <div className="text-4xl font-bold text-blue-700">{qualityScore}</div>
                <div className="text-xs text-gray-600 mt-1">out of 100</div>
              </div>
              <div className={`text-6xl font-bold ${qualityScore >= 80 ? 'text-green-600' : qualityScore >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                {qualityScore >= 80 ? '✓' : '!'}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Top Metrics</div>
              {latestQualityReport.metrics && (
                <div className="space-y-2">
                  {Object.entries(latestQualityReport.metrics)
                    .slice(0, 4)
                    .map(([name, data]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm text-gray-700 capitalize">{name.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{data.value}{data.unit ? ` ${data.unit}` : ''}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            data.status === 'pass' ? 'bg-green-100 text-green-700' :
                            data.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Summary */}
          {latestQualityReport.analysis_summary && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3">Analysis Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-gray-600">Modules</div>
                  <div className="text-lg font-bold text-gray-900">{latestQualityReport.analysis_summary.modules_analyzed}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Tests</div>
                  <div className="text-lg font-bold text-gray-900">{latestQualityReport.analysis_summary.test_files_found}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">LOC</div>
                  <div className="text-lg font-bold text-gray-900">{latestQualityReport.analysis_summary.total_lines}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Type</div>
                  <div className="text-sm font-bold text-gray-900">{latestQualityReport.report_type}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Preview */}
          {latestQualityReport.recommendations && latestQualityReport.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900">Top Recommendations</h3>
              <ul className="space-y-1">
                {latestQualityReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              {latestQualityReport.recommendations.length > 3 && (
                <button
                  onClick={onViewQualityReport}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
                >
                  +{latestQualityReport.recommendations.length - 3} more →
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300">
        <h3 className="text-lg font-bold mb-4">📋 Next Steps</h3>
        <ol className="space-y-2 text-sm text-gray-700 ml-4">
          <li><span className="font-bold">1.</span> Review the generated files in the Generated Files tab</li>
          <li><span className="font-bold">2.</span> Check the Build Report for compilation details and test results</li>
          <li><span className="font-bold">3.</span> Review the Quality Report to understand code metrics and recommendations</li>
          <li><span className="font-bold">4.</span> Integrate the generated code into your project</li>
          <li><span className="font-bold">5.</span> Run the generated unit tests in your environment</li>
        </ol>
      </Card>
    </div>
  );
};
