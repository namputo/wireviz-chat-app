'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Download, Eye, EyeOff } from 'lucide-react'

interface DiagramPreviewProps {
  yamlContent?: string
}

export default function DiagramPreview({ yamlContent }: DiagramPreviewProps) {
  const [diagramData, setDiagramData] = useState<string | null>(null)
  const [bomData, setBomData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBom, setShowBom] = useState(false)
  const [format, setFormat] = useState<'svg' | 'png' | 'html'>('svg')

  const generatePreview = async (yaml?: string) => {
    const contentToUse = yaml || yamlContent
    if (!contentToUse) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          yaml_content: contentToUse,
          format: format
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setDiagramData(data.diagram_data)
        setBomData(data.bom_data)
      } else {
        setError(data.error || 'Failed to generate diagram')
      }
    } catch (error) {
      setError('Error connecting to server. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (yamlContent) {
      const debounceTimer = setTimeout(() => {
        generatePreview(yamlContent)
      }, 1000)

      return () => clearTimeout(debounceTimer)
    }
  }, [yamlContent, format])

  const downloadDiagram = () => {
    if (!diagramData) return

    let blob: Blob
    let filename: string

    if (format === 'svg') {
      blob = new Blob([diagramData], { type: 'image/svg+xml' })
      filename = 'wiring-diagram.svg'
    } else if (format === 'png') {
      const binaryString = atob(diagramData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      blob = new Blob([bytes], { type: 'image/png' })
      filename = 'wiring-diagram.png'
    } else {
      blob = new Blob([diagramData], { type: 'text/html' })
      filename = 'wiring-diagram.html'
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadBom = () => {
    if (!bomData) return

    const blob = new Blob([bomData], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bill-of-materials.tsv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderBomTable = (tsvData: string) => {
    if (!tsvData) return null

    // Parse TSV data
    const lines = tsvData.trim().split('\n')
    if (lines.length < 2) {
      return (
        <div className="text-center text-gray-500 py-4">
          <p>No BOM data available</p>
        </div>
      )
    }

    // Extract headers and rows
    const headers = lines[0].split('\t').map(h => h.trim())
    const rows = lines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    )

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-500 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-600">
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="border border-gray-500 px-4 py-3 text-left text-sm font-semibold text-gray-200 font-sans"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600/50'}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="border border-gray-500 px-4 py-3 text-sm text-gray-200 font-medium"
                  >
                    {cell || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Summary */}
        <div className="mt-4 text-sm text-gray-300 font-medium">
          <div className="flex justify-between items-center bg-gray-600 border border-gray-500 rounded-lg p-3">
            <span>Total Components:</span>
            <span className="font-semibold text-blue-400">{rows.length}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Developer-friendly Header */}
      <div className="bg-gray-700 text-white p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm">👁️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono">Preview</h2>
              <p className="text-gray-300 text-xs font-medium">Live diagram visualization</p>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'svg' | 'png' | 'html')}
              className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            >
              <option value="svg" className="text-gray-800 bg-white">SVG</option>
              <option value="png" className="text-gray-800 bg-white">PNG</option>
              <option value="html" className="text-gray-800 bg-white">HTML</option>
            </select>
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-300 text-xs">
                <div className="w-3 h-3 border-2 border-gray-500 border-t-purple-400 rounded-full animate-spin"></div>
                <span className="font-mono">Generating...</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => generatePreview()}
              disabled={isLoading}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 transition-all duration-200"
              title="Refresh preview"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {diagramData && (
              <button
                onClick={downloadDiagram}
                className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-all duration-200"
                title="Download diagram"
              >
                <Download size={16} />
              </button>
            )}
            {bomData && (
              <button
                onClick={() => setShowBom(!showBom)}
                className={`p-2 rounded-md transition-all duration-200 ${showBom ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Toggle BOM"
              >
                {showBom ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-800 p-6">
        {!isLoading && !error && diagramData && (
          <div className="space-y-6">
            {/* Main Diagram */}
            <div className="bg-gray-700 rounded-xl border border-gray-600 shadow-sm overflow-hidden">
              <div className="bg-gray-600 px-6 py-4 border-b border-gray-500">
                <h3 className="font-semibold text-gray-200">Wiring Diagram</h3>
                <p className="text-sm text-gray-300 mt-1">Generated from your YAML configuration</p>
              </div>
              <div className="p-6">
                {format === 'svg' && (
                  <div className="flex justify-center">
                    <div dangerouslySetInnerHTML={{ __html: diagramData }} />
                  </div>
                )}
                {format === 'png' && (
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${diagramData}`} 
                      alt="Wiring diagram"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                )}
                {format === 'html' && (
                  <iframe
                    srcDoc={diagramData}
                    className="w-full h-96 border border-gray-500 rounded-lg"
                    title="Wiring diagram"
                  />
                )}
              </div>
            </div>
            
            {/* Bill of Materials */}
            {showBom && bomData && (
              <div className="bg-gray-700 rounded-xl border border-gray-600 shadow-sm overflow-hidden">
                <div className="bg-gray-600 px-6 py-4 border-b border-gray-500 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-200 font-sans">Bill of Materials</h3>
                    <p className="text-sm text-gray-300 mt-1 font-medium">Component list and specifications</p>
                  </div>
                  <button
                    onClick={downloadBom}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                  >
                    Download BOM
                  </button>
                </div>
                <div className="p-6">
                  {renderBomTable(bomData)}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-200 font-medium font-sans">Generating your diagram...</p>
              <p className="text-sm text-gray-400 mt-1 font-medium">This may take a few seconds</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-red-300 mb-2">Generation Failed</h3>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && !diagramData && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-semibold text-gray-200 mb-2 font-sans">Ready to visualize</h3>
              <p className="text-gray-300 font-medium">Edit the YAML or chat with AI to create your wiring diagram</p>
              <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Use chat for guidance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Edit YAML directly</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}