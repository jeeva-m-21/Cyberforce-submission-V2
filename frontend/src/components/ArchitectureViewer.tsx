import React, { useEffect, useState } from 'react';
import { Card } from './ui';
import toast from 'react-hot-toast';
import { FiFileText, FiDownload, FiRefreshCw } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

interface ArchitectureFile {
  run_id: string;
  filename: string;
  content: string;
  timestamp: string;
}

export const ArchitectureViewer: React.FC<{ runId?: string }> = ({ runId }) => {
  const [architectures, setArchitectures] = useState<ArchitectureFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ArchitectureFile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (runId) {
      loadArchitectureForRun(runId);
    } else {
      loadAllArchitectures();
    }
  }, [runId]);

  const loadAllArchitectures = async () => {
    setLoading(true);
    try {
      // Load from output/runs directory structure
      const response = await fetch('/api/architectures');
      if (response.ok) {
        const data = await response.json();
        setArchitectures(data);
        if (data.length > 0) {
          setSelectedFile(data[0]);
        }
      }
    } catch (error) {
      toast.error('Failed to load architecture files');
    } finally {
      setLoading(false);
    }
  };

  const loadArchitectureForRun = async (runId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/runs/${runId}/architecture`);
      if (response.ok) {
        const data = await response.json();
        setArchitectures([data]);
        setSelectedFile(data);
      }
    } catch (error) {
      toast.error('Failed to load architecture');
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = () => {
    if (!selectedFile) return;
    
    const blob = new Blob([selectedFile.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Architecture downloaded');
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <FiRefreshCw className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
          <p className="text-gray-600">Loading architecture...</p>
        </div>
      </Card>
    );
  }

  if (architectures.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <FiFileText className="mx-auto text-5xl mb-4 text-gray-400" />
          <p className="text-lg mb-2">No Architecture Files Yet</p>
          <p className="text-sm">Generate firmware to create architecture documentation</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* File List */}
      <div className="col-span-3">
        <Card className="h-full">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FiFileText /> Architecture Files
          </h3>
          <div className="space-y-2">
            {architectures.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedFile?.filename === file.filename
                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-medium text-sm truncate">{file.filename}</div>
                <div className="text-xs text-gray-500 mt-1">Run: {file.run_id.slice(0, 8)}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Content Viewer */}
      <div className="col-span-9">
        <Card>
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold">{selectedFile?.filename}</h2>
              <p className="text-sm text-gray-600">
                Generated: {selectedFile?.timestamp ? new Date(selectedFile.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </div>
            <button
              onClick={downloadMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiDownload /> Download MD
            </button>
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-gray-800" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-3 text-gray-700 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700" {...props} />,
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props} />
                    ) : (
                      <code className="block bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto" {...props} />
                    ),
                  pre: ({ node, ...props }) => <pre className="mb-4 overflow-x-auto" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-300" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold" {...props} />,
                  td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                }}
              >
                {selectedFile?.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
