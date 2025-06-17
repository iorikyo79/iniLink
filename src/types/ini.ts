export interface IniSection {
  name: string;
  keys: IniKey[];
  isExpanded: boolean;
}

export interface IniKey {
  key: string;
  value: string;
  originalValue: string;
  section: string;
  type: 'string' | 'number' | 'boolean';
  isModified: boolean;
  comment?: string;
  error?: string;
}

export interface IniChange {
  id: string;
  timestamp: Date;
  section: string;
  key: string;
  oldValue: string;
  newValue: string;
  comment?: string;
  type: 'modify' | 'add' | 'delete' | 'add_section' | 'delete_section';
}

export interface ValidationError {
  type: 'syntax' | 'duplicate_key' | 'invalid_section' | 'invalid_value' | 'empty_key' | 'reserved_word';
  message: string;
  line?: number;
  section?: string;
  key?: string;
  severity: 'error' | 'warning';
}

export interface IniData {
  sections: IniSection[];
  raw: Record<string, any>;
  filename: string;
  validationErrors?: ValidationError[];
}

export interface EditorState {
  data: IniData | null;
  changes: IniChange[];
  selectedKey: IniKey | null;
  searchQuery: string;
  isDirty: boolean;
  history: IniData[];
  historyIndex: number;
}