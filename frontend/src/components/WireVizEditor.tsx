'use client'

import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Download, Copy, Upload, FolderOpen, Save, Undo, Redo } from 'lucide-react'

const defaultYaml = ``

interface WireVizEditorProps {
  onYamlChange?: (yaml: string) => void
  yamlContent?: string
}

export default function WireVizEditor({ onYamlChange, yamlContent: externalYamlContent }: WireVizEditorProps) {
  const [editorContent, setEditorContent] = useState(externalYamlContent || defaultYaml)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const [editingFileName, setEditingFileName] = useState('')
  const [isModified, setIsModified] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [history, setHistory] = useState<string[]>([defaultYaml])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false)
  const lastExternalContent = useRef(externalYamlContent)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxHistoryLength = 10

  // Update editor when external content changes (from chat)
  useEffect(() => {
    if (externalYamlContent && 
        externalYamlContent !== lastExternalContent.current && 
        externalYamlContent !== editorContent) {
      console.log('Updating editor with external content:', externalYamlContent)
      setEditorContent(externalYamlContent)
      lastExternalContent.current = externalYamlContent
      // Add external content to history
      addToHistory(externalYamlContent)
    }
  }, [externalYamlContent, editorContent])

  const addToHistory = (content: string) => {
    if (isUndoRedoAction) return // Don't add to history during undo/redo
    
    setHistory(prev => {
      // If we're not at the end of history, remove everything after current index
      const newHistory = prev.slice(0, historyIndex + 1)
      
      // Add new content
      newHistory.push(content)
      
      // Keep only last maxHistoryLength items
      if (newHistory.length > maxHistoryLength) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistoryLength - 1)
      return newIndex
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || ''
    console.log('Editor changed:', newValue)
    setEditorContent(newValue)
    onYamlChange?.(newValue)
    
    // Add to history if it's a user edit (not undo/redo)
    if (!isUndoRedoAction && newValue !== history[historyIndex]) {
      addToHistory(newValue)
    }
    
    // Check if content has been modified from original
    if (currentFileName && originalContent !== newValue) {
      setIsModified(true)
    } else if (!currentFileName) {
      setIsModified(false)
    }
  }

  const generateDiagram = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('http://localhost:8000/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          yaml_content: editorContent,
          format: 'svg'
        }),
      })

      const data = await response.json()
      console.log('Diagram generated:', data)
    } catch (error) {
      console.error('Error generating diagram:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorContent)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadYaml = () => {
    const fileName = currentFileName || 'wiring-diagram.yml'
    const blob = new Blob([editorContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickSave = () => {
    if (currentFileName) {
      // Save the current content as the original content
      setOriginalContent(editorContent)
      setIsModified(false)
      
      // Also trigger download to actually save the file
      downloadYaml()
    }
  }

  const openFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a YAML file
    if (!file.name.toLowerCase().match(/\.(yml|yaml)$/)) {
      alert('Please select a YAML file (.yml or .yaml)')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setEditorContent(content)
        setCurrentFileName(file.name)
        setOriginalContent(content)
        setIsModified(false)
        // Reset history when loading a new file
        setHistory([content])
        setHistoryIndex(0)
        onYamlChange?.(content)
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const createNewFile = () => {
    if (isModified || editorContent.trim() !== '') {
      const confirmNew = window.confirm('Are you sure you want to create a new file? Your current changes will be lost.')
      if (!confirmNew) return
    }
    
    setEditorContent(defaultYaml)
    setCurrentFileName(null)
    setOriginalContent('')
    setIsModified(false)
    // Reset history when creating a new file
    setHistory([defaultYaml])
    setHistoryIndex(0)
    onYamlChange?.(defaultYaml)
  }

  const startEditingFileName = () => {
    if (currentFileName) {
      setEditingFileName(currentFileName)
      setIsEditingFileName(true)
    }
  }

  const saveFileName = () => {
    if (editingFileName.trim()) {
      // Ensure it has a .yml or .yaml extension
      let newFileName = editingFileName.trim()
      if (!newFileName.toLowerCase().endsWith('.yml') && !newFileName.toLowerCase().endsWith('.yaml')) {
        newFileName += '.yml'
      }
      setCurrentFileName(newFileName)
    }
    setIsEditingFileName(false)
    setEditingFileName('')
  }

  const cancelEditingFileName = () => {
    setIsEditingFileName(false)
    setEditingFileName('')
  }

  const handleFileNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveFileName()
    } else if (e.key === 'Escape') {
      cancelEditingFileName()
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const content = history[newIndex]
      
      setIsUndoRedoAction(true)
      setEditorContent(content)
      setHistoryIndex(newIndex)
      onYamlChange?.(content)
      
      // Reset flag after a brief delay to allow the change to propagate
      setTimeout(() => setIsUndoRedoAction(false), 100)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const content = history[newIndex]
      
      setIsUndoRedoAction(true)
      setEditorContent(content)
      setHistoryIndex(newIndex)
      onYamlChange?.(content)
      
      // Reset flag after a brief delay to allow the change to propagate
      setTimeout(() => setIsUndoRedoAction(false), 100)
    }
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
      } else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history])

  return (
    <div className="h-full flex flex-col">
      {/* Developer-friendly Header */}
      <div className="bg-gray-700 text-white p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono">YAML Editor</h2>
              <p className="text-gray-300 text-xs font-medium">
                {currentFileName ? (
                  <span>
                    {currentFileName}
                    {isModified && <span className="text-orange-400 ml-1">● modified</span>}
                  </span>
                ) : (
                  'WireViz Configuration'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={createNewFile}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-all duration-200"
              title="New file"
            >
              <span className="text-sm">📄</span>
            </button>
            <button
              onClick={openFile}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-all duration-200"
              title="Open YAML file"
            >
              <FolderOpen size={16} />
            </button>
            <div className="flex space-x-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 bg-gray-600 rounded-l-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={16} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 bg-gray-600 rounded-r-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={16} />
              </button>
            </div>
            {currentFileName && (
              <button
                onClick={quickSave}
                className={`p-2 rounded-md transition-all duration-200 ${
                  isModified 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={isModified ? "Quick save (file modified)" : "Quick save"}
              >
                <Save size={16} />
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-all duration-200"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={downloadYaml}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-all duration-200"
              title="Download YAML"
            >
              <Download size={16} />
            </button>
            <button
              onClick={generateDiagram}
              disabled={isGenerating}
              className="p-2 bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-all duration-200"
              title="Generate diagram"
            >
              <Play size={16} className={isGenerating ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* Status indicator and file info */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300 font-mono">Live editing</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="font-mono">History:</span>
              <span className="bg-gray-600 px-2 py-0.5 rounded-md font-mono">
                {historyIndex + 1}/{history.length}
              </span>
            </div>
          </div>
          
          {currentFileName && (
            <div className="text-gray-300 font-mono bg-gray-600 px-2 py-1 rounded-md">
              {isEditingFileName ? (
                <div className="flex items-center space-x-2">
                  <span>📁</span>
                  <input
                    type="text"
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    onKeyDown={handleFileNameKeyPress}
                    onBlur={saveFileName}
                    className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded text-xs font-mono min-w-0 flex-1"
                    style={{ width: `${Math.max(editingFileName.length * 8, 60)}px` }}
                    autoFocus
                  />
                  <button
                    onClick={saveFileName}
                    className="text-green-400 hover:text-green-300 text-xs"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEditingFileName}
                    className="text-red-400 hover:text-red-300 text-xs"
                    title="Cancel"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditingFileName}
                  className="flex items-center space-x-1 hover:bg-gray-500 px-1 py-0.5 rounded transition-colors"
                  title="Click to rename file"
                >
                  <span>📁</span>
                  <span>{currentFileName}</span>
                  {isModified && <span className="text-orange-400 text-xs ml-1">●</span>}
                  <span className="text-gray-400 text-xs ml-1">✏️</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".yml,.yaml"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Code Editor */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gray-900">
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={editorContent}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              folding: true,
              bracketMatching: 'always',
              autoIndent: 'full',
              readOnly: false,
              selectOnLineNumbers: true,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              padding: { top: 20, bottom: 20 },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'gutter',
              lineHeight: 1.6
            }}
          />
        </div>
        
        {/* Editor overlay info */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs">
          {editorContent.split('\n').length} lines
        </div>
      </div>
    </div>
  )
}