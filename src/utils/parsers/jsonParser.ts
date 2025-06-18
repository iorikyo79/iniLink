import { UnifiedNode, FileType } from '../../types/unified';
import { createUnifiedNode, inferDataType } from '../fileProcessor';

export function parseJsonContent(content: string, filename: string): UnifiedNode {
  try {
    const parsed = JSON.parse(content);
    
    function convertToUnified(obj: any, path: string, key: string): UnifiedNode {
      if (obj === null || obj === undefined) {
        return createUnifiedNode(path, key, obj, 'json');
      }

      if (Array.isArray(obj)) {
        const children = obj.map((item, index) =>
          convertToUnified(item, `${path}[${index}]`, `[${index}]`)
        );
        return createUnifiedNode(path, key, null, 'json', children);
      }

      if (typeof obj === 'object') {
        const children = Object.entries(obj).map(([childKey, childValue]) =>
          convertToUnified(childValue, path ? `${path}.${childKey}` : childKey, childKey)
        );
        return createUnifiedNode(path, key, null, 'json', children);
      }

      return createUnifiedNode(path, key, obj, 'json');
    }

    return convertToUnified(parsed, filename, filename);
  } catch (error) {
    throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateJsonSchema(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    JSON.parse(content);
    
    // Additional JSON validation rules
    if (content.trim().length === 0) {
      errors.push('JSON content cannot be empty');
    }
    
    // Check for common JSON issues
    if (content.includes('\t')) {
      errors.push('JSON contains tab characters - consider using spaces for indentation');
    }
    
    // Check for trailing commas (not allowed in strict JSON)
    if (/,\s*[}\]]/.test(content)) {
      errors.push('JSON contains trailing commas which are not allowed in strict JSON');
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`JSON syntax error: ${error.message}`);
    } else {
      errors.push(`JSON validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { isValid: false, errors };
  }
}

export function formatJsonContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Cannot format invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}