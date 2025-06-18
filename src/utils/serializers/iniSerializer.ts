import ini from 'ini';
import { UnifiedNode } from '../../types/unified';

export function serializeIniContent(data: UnifiedNode): string {
  const result: Record<string, any> = {};

  function processNode(node: UnifiedNode, parentPath: string = '') {
    if (!node.children) {
      // Leaf node
      if (parentPath === 'root' || parentPath === '') {
        result[node.key] = node.value;
      } else {
        if (!result[parentPath]) {
          result[parentPath] = {};
        }
        result[parentPath][node.key] = node.value;
      }
      return;
    }

    // Container node
    node.children.forEach(child => {
      if (node.key === 'Root' || node.path === 'root') {
        processNode(child, '');
      } else {
        processNode(child, node.key);
      }
    });
  }

  if (data.children) {
    data.children.forEach(child => processNode(child));
  }

  return ini.stringify(result);
}