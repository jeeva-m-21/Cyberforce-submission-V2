import React, { useState, useEffect } from 'react'
import { FiBook } from 'react-icons/fi'
import { apiClient } from '../api/client'
import { Card } from './ui'

export function Documentation() {
  const [docs, setDocs] = useState<Record<string, any>>({})
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDocs()
  }, [])

  const loadDocs = async () => {
    setLoading(true)
    try {
      const res = await apiClient.getRAGDocs()
      // map array of docs into keyed object for the UI
      const mapped: Record<string, any> = {}
      res.forEach((d: any) => {
        const key = (d.title || 'untitled').toLowerCase().replace(/\s+/g, '_')
        mapped[key] = [d.content]
      })
      setDocs(mapped)
    } catch (error) {
      console.error('Failed to load documentation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FiBook />
        Documentation & Resources
      </h2>

      {loading ? (
        <Card className="p-6">
          <p className="text-gray-500">Loading documentation...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {Object.keys(docs).map((docKey) => (
            <Card
              key={docKey}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDoc(docKey)}
            >
              <h3 className="font-semibold capitalize">{docKey.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-gray-600 mt-2">Click to view</p>
            </Card>
          ))}
        </div>
      )}

      {selectedDoc && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold capitalize">{selectedDoc.replace(/_/g, ' ')}</h3>
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {docs[selectedDoc]?.[1]?.slice(0, 1000)}...
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
