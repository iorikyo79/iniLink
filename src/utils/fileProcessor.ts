import { FileType, UnifiedNode, DataType } from '../types/unified';
import { parseIniContent } from './parsers/iniParser';
import { parseJsonContent } from './parsers/jsonParser';
import { parseXmlContent } from './parsers/xmlParser';
import { serializeIniContent } from './serializers/iniSerializer';
import { serializeJsonContent } from './serializers/jsonSerializer';
import { serializeXmlContent } from './serializers/xmlSerializer';

export class FileProcessor {
  acceptedTypes: string[] = ['.ini', '.json', '.xml', '.txt', '.config'];
  maxFileSize: number = 10 * 1024 * 1024; // 10MB

  detectFileType(file: File): FileType {
    const extension = file.name.toLowerCase().split('.').pop();
    const mimeType = file.type.toLowerCase();

    // Check by extension first
    switch (extension) {
      case 'ini':
      case 'cfg':
      case 'conf':
      case 'config':
        return 'ini';
      case 'json':
        return 'json';
      case 'xml':
      case 'config':
        return 'xml';
    }

    // Check by MIME type
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('xml')) return 'xml';

    // Default to INI for text files
    return 'ini';
  }

  async parseContent(content: string, fileType: FileType, filename: string): Promise<UnifiedNode> {
    try {
      switch (fileType) {
        case 'ini':
          return parseIniContent(content, filename);
        case 'json':
          return parseJsonContent(content, filename);
        case 'xml':
          // XML parsing is async, so we await it
          return await parseXmlContent(content, filename);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${fileType.toUpperCase()} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  serializeContent(data: UnifiedNode, fileType: FileType): string {
    try {
      switch (fileType) {
        case 'ini':
          return serializeIniContent(data);
        case 'json':
          return serializeJsonContent(data);
        case 'xml':
          return serializeXmlContent(data);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to serialize ${fileType.toUpperCase()} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`
      };
    }

    // Check file extension
    const extension = '.' + file.name.toLowerCase().split('.').pop();
    if (!this.acceptedTypes.includes(extension)) {
      return {
        isValid: false,
        error: `File type not supported. Accepted types: ${this.acceptedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  sanitizeInput(input: string): string {
    // Remove potentially dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

export function inferDataType(value: any): DataType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    // Try to infer more specific types
    const trimmed = value.trim();
    
    // Boolean patterns
    if (/^(true|false|yes|no|on|off|1|0)$/i.test(trimmed)) {
      return 'boolean';
    }
    
    // Number patterns
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !isNaN(Number(trimmed))) {
      return 'number';
    }
  }
  return 'string';
}

export function createUnifiedNode(
  path: string,
  key: string,
  value: any,
  fileType: FileType,
  children?: UnifiedNode[]
): UnifiedNode {
  return {
    path,
    key,
    value,
    type: inferDataType(value),
    children,
    metadata: {
      originalFormat: fileType,
      lastModified: new Date(),
      isExpanded: true,
      isModified: false,
      originalValue: value
    }
  };
}