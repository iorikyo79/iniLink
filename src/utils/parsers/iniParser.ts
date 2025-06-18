import ini from 'ini';
import { UnifiedNode, FileType } from '../../types/unified';
import { createUnifiedNode, inferDataType } from '../fileProcessor';

export function parseIniContent(content: string, filename: string): UnifiedNode {
  try {
    const parsed = ini.parse(content);
    const children: UnifiedNode[] = [];

    // Handle root level keys
    const rootKeys: UnifiedNode[] = [];
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        rootKeys.push(createUnifiedNode(
          key,
          key,
          value,
          'ini'
        ));
      }
    });

    if (rootKeys.length > 0) {
      children.push(createUnifiedNode(
        'root',
        'Root',
        null,
        'ini',
        rootKeys
      ));
    }

    // Handle sections
    Object.entries(parsed).forEach(([sectionName, sectionData]) => {
      if (typeof sectionData === 'object' && sectionData !== null) {
        const sectionKeys: UnifiedNode[] = Object.entries(sectionData).map(([key, value]) =>
          createUnifiedNode(
            `${sectionName}.${key}`,
            key,
            value,
            'ini'
          )
        );

        children.push(createUnifiedNode(
          sectionName,
          sectionName,
          null,
          'ini',
          sectionKeys
        ));
      }
    });

    return createUnifiedNode(
      filename,
      filename,
      null,
      'ini',
      children
    );
  } catch (error) {
    throw new Error(`INI parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}