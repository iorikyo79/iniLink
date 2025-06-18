import { parseString } from 'xml2js';
import { UnifiedNode, FileType } from '../../types/unified';
import { createUnifiedNode, inferDataType } from '../fileProcessor';

export function parseXmlContent(content: string, filename: string): Promise<UnifiedNode> {
  return new Promise((resolve, reject) => {
    parseString(content, { 
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
      explicitRoot: true
    }, (err, result) => {
      if (err) {
        reject(new Error(`XML parsing error: ${err.message}`));
        return;
      }

      try {
        function convertToUnified(obj: any, path: string, key: string): UnifiedNode {
          if (obj === null || obj === undefined || typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
            return createUnifiedNode(path, key, obj, 'xml');
          }

          if (Array.isArray(obj)) {
            const children = obj.map((item, index) =>
              convertToUnified(item, `${path}[${index}]`, `[${index}]`)
            );
            return createUnifiedNode(path, key, null, 'xml', children);
          }

          if (typeof obj === 'object') {
            const children: UnifiedNode[] = [];
            
            // Handle attributes
            Object.entries(obj).forEach(([childKey, childValue]) => {
              if (childKey.startsWith('$')) {
                // Skip xml2js metadata
                return;
              }
              
              const childPath = path ? `${path}.${childKey}` : childKey;
              children.push(convertToUnified(childValue, childPath, childKey));
            });

            return createUnifiedNode(path, key, null, 'xml', children);
          }

          return createUnifiedNode(path, key, obj, 'xml');
        }

        const unified = convertToUnified(result, filename, filename);
        resolve(unified);
      } catch (error) {
        reject(new Error(`XML conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  });
}