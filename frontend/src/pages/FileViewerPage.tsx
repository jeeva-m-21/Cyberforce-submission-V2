import React, { useEffect, useState } from 'react'
import { apiClient, ArtifactEntry } from '../api/client'
import { Card } from '../components/ui'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiDownload, FiCopy, FiCheck, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FileViewerPageProps {
  artifact: ArtifactEntry
  onBack: () => void
}

export const FileViewerPage: React.FC<FileViewerPageProps> = ({ artifact, onBack }) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadContent()
  }, [artifact])

  const loadContent = async () => {
    setLoading(true)
    try {
      const resp = await apiClient.getArtifactContent(artifact.run_id, artifact.file_path)
      setContent(resp?.content || '')
    } catch (err: any) {
      toast.error('Failed to load file content')
      setContent('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = artifact.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('File downloaded')
  }

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      c: 'c',
      h: 'c',
      cpp: 'cpp',
      hpp: 'cpp',
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      txt: 'text',
      ino: 'cpp', // Arduino
      makefile: 'makefile',
    }
    return langMap[ext || ''] || 'text'
  }

  const language = getLanguageFromFilename(artifact.file_name)

  // Check if content looks like markdown (even if file extension is .txt)
  const isMarkdownContent = (text: string): boolean => {
    if (!text) return false
    
    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+.+$/m,           // Headers (# ## ###)
      /^\*\*[^*]+\*\*$/m,         // Bold
      /^\*[^*]+\*$/m,             // Italic
      /^\|.+\|.+\|$/m,            // Tables
      /^[-*+]\s+.+$/m,            // Lists
      /^\d+\.\s+.+$/m,            // Numbered lists
      /```[\s\S]*?```/,           // Code blocks
      /\[.+\]\(.+\)/,             // Links
    ]
    
    return markdownPatterns.some(pattern => pattern.test(text))
  }

  const shouldRenderAsMarkdown = language === 'markdown' || 
                                  (language === 'text' && 
                                   (artifact.category === 'architecture' || 
                                    artifact.file_path.includes('architecture') ||
                                    isMarkdownContent(content)))

  const renderContent = () => {
    if (!content || content === 'Failed to load content') {
      return <div className="text-muted">No content available</div>
    }

    // Markdown files or text files with markdown content
    if (shouldRenderAsMarkdown) {
      return (
        <div className="prose prose-invert max-w-none p-8 bg-gradient-to-br from-[#071018] to-[#0a1929] rounded-lg border border-var overflow-auto max-h-[70vh] shadow-inner">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                const lang = match ? match[1] : ''
                return !inline && lang ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={lang}
                    PreTag="div"
                    customStyle={{
                      borderRadius: '0.5em',
                      padding: '1em',
                      marginTop: '0.5em',
                      marginBottom: '0.5em',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-800 px-2 py-0.5 rounded text-amber-400 text-sm" {...props}>
                    {children}
                  </code>
                )
              },
              table({ children, ...props }: any) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden" {...props}>
                      {children}
                    </table>
                  </div>
                )
              },
              thead({ children, ...props }: any) {
                return (
                  <thead className="bg-gray-800/50" {...props}>
                    {children}
                  </thead>
                )
              },
              th({ children, ...props }: any) {
                return (
                  <th className="border border-gray-700 px-4 py-2 text-left font-semibold" {...props}>
                    {children}
                  </th>
                )
              },
              td({ children, ...props }: any) {
                return (
                  <td className="border border-gray-700 px-4 py-2" {...props}>
                    {children}
                  </td>
                )
              },
              blockquote({ children, ...props }: any) {
                return (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-900/10 italic" {...props}>
                    {children}
                  </blockquote>
                )
              },
              hr({ ...props }: any) {
                return <hr className="border-gray-700 my-6" {...props} />
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }

    // JSON files - structured display
    if (language === 'json' && artifact.file_name.includes('build')) {
      return renderBuildLog()
    }

    if (language === 'json' && (artifact.file_name.includes('quality') || artifact.file_name.includes('report'))) {
      return renderQualityReport()
    }

    if (language === 'json') {
      return renderGenericJson()
    }

    // Code files with syntax highlighting
    if (['c', 'cpp', 'python', 'javascript', 'typescript'].includes(language)) {
      return (
        <div className="rounded-lg border border-var overflow-hidden">
          <div className="bg-black/50 px-4 py-2 text-xs text-muted border-b border-var flex items-center justify-between">
            <span>{language.toUpperCase()}</span>
            <span>{content.split('\n').length} lines</span>
          </div>
          <SyntaxHighlighter
            language={language === 'cpp' ? 'c' : language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              maxHeight: '70vh',
              fontSize: '13px',
              background: '#071018',
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      )
    }

    // Plain text fallback
    return (
      <div className="relative">
        <div className="absolute top-3 right-3 text-xs text-muted bg-black/50 px-2 py-1 rounded z-10">
          {language}
        </div>
        <pre className="text-sm surface border border-var rounded-lg p-4 overflow-auto max-h-[70vh] font-mono text-green-200 bg-[#071018] leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    )
  }

  const renderBuildLog = () => {
    try {
      const data = JSON.parse(content)
      return (
        <div className="space-y-4 p-6 bg-[#071018] rounded-lg border border-var overflow-auto max-h-[70vh]">
          <h3 className="text-lg font-semibold text-white mb-4">Build Log</h3>
          
          {data.timestamp && (
            <div className="text-sm text-muted">
              <span className="text-white/60">Timestamp:</span> {new Date(data.timestamp).toLocaleString()}
            </div>
          )}

          {data.success !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              {data.success ? (
                <>
                  <FiCheckCircle className="text-green-400" />
                  <span className="text-green-400 font-semibold">Build Successful</span>
                </>
              ) : (
                <>
                  <FiAlertCircle className="text-red-400" />
                  <span className="text-red-400 font-semibold">Build Failed</span>
                </>
              )}
            </div>
          )}

          {data.duration && (
            <div className="text-sm text-muted">
              <span className="text-white/60">Duration:</span> {data.duration}
            </div>
          )}

          {data.output && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-white mb-2">Output:</div>
              <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 overflow-auto max-h-96 text-gray-300">
                {data.output}
              </pre>
            </div>
          )}

          {data.errors && data.errors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-red-400 mb-2">Errors:</div>
              <div className="space-y-2">
                {data.errors.map((error: any, idx: number) => (
                  <div key={idx} className="bg-red-900/20 border border-red-500/40 rounded p-3 text-sm">
                    <pre className="text-red-200 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.warnings && data.warnings.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-yellow-400 mb-2">Warnings:</div>
              <div className="space-y-2">
                {data.warnings.map((warning: any, idx: number) => (
                  <div key={idx} className="bg-yellow-900/20 border border-yellow-500/40 rounded p-3 text-sm text-yellow-200">
                    {typeof warning === 'string' ? warning : JSON.stringify(warning, null, 2)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    } catch (err) {
      return renderGenericJson()
    }
  }

  const renderQualityReport = () => {
    try {
      const data = JSON.parse(content)
      return (
        <div className="space-y-6 p-6 bg-[#071018] rounded-lg border border-var overflow-auto max-h-[70vh]">
          <h3 className="text-lg font-semibold text-white mb-4">Quality Report</h3>
          
          {data.summary && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.summary).map(([key, value]: any) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-muted capitalize">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.metrics && (
            <div>
              <div className="text-sm font-semibold text-white mb-3">Metrics</div>
              <div className="space-y-2">
                {Object.entries(data.metrics).map(([key, value]: any) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded border border-white/10">
                    <span className="text-sm capitalize text-muted">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-white">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.issues && data.issues.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-white mb-3">Issues Found</div>
              <div className="space-y-2">
                {data.issues.map((issue: any, idx: number) => (
                  <div key={idx} className="bg-yellow-900/20 border border-yellow-500/40 rounded p-3">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-yellow-200">{issue.type || 'Issue'}</div>
                        <div className="text-xs text-yellow-100 mt-1">{issue.message || issue.description}</div>
                        {issue.location && (
                          <div className="text-xs text-yellow-300 mt-1">Location: {issue.location}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.details && (
            <div>
              <div className="text-sm font-semibold text-white mb-3">Details</div>
              <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 overflow-auto max-h-96 text-gray-300">
                {JSON.stringify(data.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )
    } catch (err) {
      return renderGenericJson()
    }
  }

  const renderGenericJson = () => {
    try {
      const data = JSON.parse(content)
      return (
        <div className="p-6 bg-[#071018] rounded-lg border border-var overflow-auto max-h-[70vh]">
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              background: 'transparent',
              fontSize: '13px',
            }}
          >
            {JSON.stringify(data, null, 2)}
          </SyntaxHighlighter>
        </div>
      )
    } catch (err) {
      return (
        <pre className="text-sm surface border border-var rounded-lg p-4 overflow-auto max-h-[70vh] font-mono text-green-200 bg-[#071018] leading-relaxed">
          <code>{content}</code>
        </pre>
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiArrowLeft />
          Back to Artifacts
        </button>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-var">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{artifact.file_name}</h2>
            <div className="space-y-1 text-sm text-muted">
              <div>
                <span className="text-white/60">Path:</span> {artifact.file_path}
              </div>
              <div>
                <span className="text-white/60">Category:</span>{' '}
                <span className="bg-white/10 px-2 py-0.5 rounded">{artifact.category}</span>
              </div>
              <div>
                <span className="text-white/60">Run ID:</span> {artifact.run_id}
              </div>
              {artifact.updated_at && (
                <div>
                  <span className="text-white/60">Last Updated:</span>{' '}
                  {new Date(artifact.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiDownload />
              Download
            </button>
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-var">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted mb-1">File Size</div>
              <div className="font-semibold">
                {content.length > 1024
                  ? `${(content.length / 1024).toFixed(2)} KB`
                  : `${content.length} bytes`}
              </div>
            </div>
            <div>
              <div className="text-muted mb-1">Lines</div>
              <div className="font-semibold">{content.split('\n').length}</div>
            </div>
            <div>
              <div className="text-muted mb-1">Type</div>
              <div className="font-semibold">
                {shouldRenderAsMarkdown ? 'MARKDOWN' : language.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FileViewerPage
