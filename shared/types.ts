export interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export interface WireVizRequest {
  yaml_content: string
  format: 'svg' | 'png' | 'html'
}

export interface WireVizResponse {
  success: boolean
  diagram_data?: string
  bom_data?: string
  error?: string
  format: 'svg' | 'png' | 'html'
}

export interface LLMResponse {
  content: string
  yaml_generated?: string
  suggestions?: string[]
}

export interface WebSocketMessage {
  type: 'yaml_update' | 'diagram_update'
  content?: string
  success?: boolean
  data?: WireVizResponse
  error?: string
}