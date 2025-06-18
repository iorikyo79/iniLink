import { parseString } from 'xml2js';
import { UnifiedNode, FileType } from '../../types/unified';
import { createUnifiedNode, inferDataType } from '../fileProcessor';

export function parseXmlContent(content: string, filename: string): Promise<UnifiedNode> {
  return new Promise((resolve, reject) => {
    try {
      parseString(content, { 
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
        explicitRoot: true,
        trim: true,
        normalize: true,
        normalizeTags: false,
        attrkey: '@',
        charkey: '#text',
        explicitCharkey: false
      }, (err, result) => {
        if (err) {
          reject(new Error(`XML parsing error: ${err.message}`));
          return;
        }

        try {
          function convertToUnified(obj: any, path: string, key: string): UnifiedNode {
            // Handle null/undefined values
            if (obj === null || obj === undefined) {
              return createUnifiedNode(path, key, null, 'xml');
            }

            // Handle primitive values
            if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
              return createUnifiedNode(path, key, obj, 'xml');
            }

            // Handle arrays
            if (Array.isArray(obj)) {
              const children = obj.map((item, index) =>
                convertToUnified(item, `${path}[${index}]`, `[${index}]`)
              );
              return createUnifiedNode(path, key, null, 'xml', children);
            }

            // Handle objects
            if (typeof obj === 'object') {
              const children: UnifiedNode[] = [];
              
              Object.entries(obj).forEach(([childKey, childValue]) => {
                // Skip xml2js internal properties
                if (childKey.startsWith('$') || childKey === '#text') {
                  return;
                }
                
                const childPath = path ? `${path}.${childKey}` : childKey;
                children.push(convertToUnified(childValue, childPath, childKey));
              });

              // Handle text content
              if (obj['#text'] && typeof obj['#text'] === 'string') {
                const textPath = path ? `${path}.#text` : '#text';
                children.push(createUnifiedNode(textPath, 'text', obj['#text'], 'xml'));
              }

              // Handle attributes
              if (obj['@'] && typeof obj['@'] === 'object') {
                Object.entries(obj['@']).forEach(([attrKey, attrValue]) => {
                  const attrPath = path ? `${path}.@${attrKey}` : `@${attrKey}`;
                  children.push(createUnifiedNode(attrPath, `@${attrKey}`, attrValue, 'xml'));
                });
              }

              return createUnifiedNode(path, key, null, 'xml', children);
            }

            return createUnifiedNode(path, key, obj, 'xml');
          }

          const unified = convertToUnified(result, filename, filename);
          resolve(unified);
        } catch (conversionError) {
          reject(new Error(`XML conversion error: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`));
        }
      });
    } catch (parseError) {
      reject(new Error(`XML parsing initialization error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`));
    }
  });
}