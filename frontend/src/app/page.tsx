'use client'

import { useState, useRef } from 'react'
import ChatInterface from '@/components/ChatInterface'
import WireVizEditor from '@/components/WireVizEditor'
import DiagramPreview from '@/components/DiagramPreview'

const defaultYaml = `connectors:
  X1:
    type: D-Sub
    subtype: female
    pincount: 9
    pins: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  X2:
    type: Molex KK
    subtype: female
    pincount: 4
    pins: [1, 2, 3, 4]

cables:
  W1:
    gauge: 22 AWG
    length: 0.2
    color_code: DIN
    wirecount: 4
    shield: true

connections:
  - 
    - X1: [1, 2, 3, 4]
    - W1: [1, 2, 3, 4]
    - X2: [1, 2, 3, 4]`

export default function Home() {
  const [yamlContent, setYamlContent] = useState(defaultYaml)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const isUpdatingFromChat = useRef(false)

  const handleYamlChange = (yaml: string) => {
    console.log('YAML changed by user:', yaml)
    setYamlContent(yaml)
  }

  const handleChatYamlGenerated = (yaml: string) => {
    console.log('YAML generated from chat:', yaml)
    if (yaml && yaml.trim()) {
      setYamlContent(yaml)
    }
  }

  const toggleChat = () => {
    setIsChatCollapsed(!isChatCollapsed)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Developer-friendly Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono">
                WireViz Editor
              </h1>
              <p className="text-gray-400 text-sm font-medium">Visual Wiring Configuration Tool</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleChat}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isChatCollapsed 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span>🤖</span>
              <span>{isChatCollapsed ? 'Show AI Chat' : 'Hide Chat'}</span>
            </button>
            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-medium">
              Live Preview
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Collapsible Chat Interface */}
        {!isChatCollapsed && (
          <div className="w-80 h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden transition-all duration-300">
            <ChatInterface 
              onYamlGenerated={handleChatYamlGenerated} 
              currentYaml={yamlContent}
            />
          </div>
        )}
        
        {/* Editor - Dynamic width based on chat state */}
        <div className={`h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden transition-all duration-300 ${
          isChatCollapsed ? 'w-1/2' : 'flex-1'
        }`}>
          <WireVizEditor 
            yamlContent={yamlContent}
            onYamlChange={handleYamlChange} 
          />
        </div>
        
        {/* Preview - Dynamic width based on chat state */}
        <div className={`h-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden transition-all duration-300 ${
          isChatCollapsed ? 'w-1/2' : 'flex-1'
        }`}>
          <DiagramPreview yamlContent={yamlContent} />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 p-3 text-center">
        <p className="text-gray-400 text-sm font-mono">
          Made with ❤️ with Claude Code by Vamsi
        </p>
      </footer>
    </div>
  )
}
