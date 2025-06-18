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