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
              return createUnifiedNode(path, key, obj, 'xml');
            }

            // Handle primitive values (string, number, boolean)
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
              if (obj['#text'] !== undefined) {
                const textPath = path ? `${path}.#text` : '#text';
                children.push(createUnifiedNode(textPath, 'text', obj['#text'], 'xml'));
              }

              return createUnifiedNode(path, key, null, 'xml', children);
            }

            // Fallback for any other type
            return createUnifiedNode(path, key, String(obj), 'xml');
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

export function validateXmlContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Basic XML validation
    if (content.trim().length === 0) {
      errors.push('XML content cannot be empty');
      return { isValid: false, errors };
    }

    // Check for XML declaration
    if (!content.trim().startsWith('<?xml') && !content.trim().startsWith('<')) {
      errors.push('XML content must start with XML declaration or root element');
    }

    // Check for basic XML structure
    const openTags = (content.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
    const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;
    
    if (openTags !== closeTags + selfClosingTags) {
      errors.push('XML has mismatched opening and closing tags');
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`XML validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors };
  }
}

export function formatXmlContent(content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      parseString(content, {
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
        normalize: true
      }, (err, result) => {
        if (err) {
          reject(new Error(`Cannot format invalid XML: ${err.message}`));
          return;
        }

        try {
          // Simple XML formatting
          let formatted = content
            .replace(/>\s*</g, '>\n<')
            .replace(/^\s+|\s+$/gm, '')
            .split('\n')
            .map((line, index) => {
              const depth = (line.match(/^<[^\/]/g) ? 1 : 0) - (line.match(/<\//g) || []).length;
              const indent = '  '.repeat(Math.max(0, depth));
              return indent + line.trim();
            })
            .join('\n');

          resolve(formatted);
        } catch (formatError) {
          reject(new Error(`XML formatting error: ${formatError instanceof Error ? formatError.message : 'Unknown error'}`));
        }
      });
    } catch (error) {
      reject(new Error(`XML formatting initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}