export type FileType = 'ini' | 'json' | 'xml';
export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface UnifiedNode {
  path: string;          // Unique path (e.g., "config.server.port")
  key: string;          // Display name
  value: any;           // Actual value or null for containers
  type: DataType;       // Data type
  children?: UnifiedNode[]; // Nested nodes
  metadata?: {          // Additional information
    comments?: string[];
    originalFormat: FileType;
    lastModified: Date;
    isExpanded?: boolean;
    isModified?: boolean;
    originalValue?: any;
  };
}

export interface FileProcessor {
  acceptedTypes: string[];
  maxFileSize: number;
  detectFileType(file: File): FileType;
  parseContent(content: string, fileType: FileType): UnifiedNode;
  serializeContent(data: UnifiedNode, fileType: FileType): string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  type: string;
}

export interface Change {
  id: string;
  timestamp: Date;
  path: string;
  oldValue: any;
  newValue: any;
  comment?: string;
  type: 'modify' | 'add' | 'delete' | 'add_node' | 'delete_node';
}

export interface EditorState {
  currentFile: {
    type: FileType;
    content: UnifiedNode;
    originalContent: string;
    filename: string;
  } | null;
  selectedNode: string | null;
  changeHistory: Change[];
  isModified: boolean;
  searchQuery: string;
  expandedPaths: Set<string>;
  history: UnifiedNode[];
  historyIndex: number;
}

export interface ShareData {
  version: string;
  fileType: FileType;
  content: string;
  filename: string;
  metadata?: {
    created: Date;
    author?: string;
  };
}