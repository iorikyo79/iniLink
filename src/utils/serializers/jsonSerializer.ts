import { UnifiedNode } from '../../types/unified';

export function serializeJsonContent(data: UnifiedNode): string {
  function processNode(node: UnifiedNode): any {
    if (!node.children) {
      return node.value;
    }

    if (node.children.some(child => child.key.startsWith('['))) {
      // Array
      const array: any[] = [];
      node.children.forEach(child => {
        const index = parseInt(child.key.replace(/[\[\]]/g, ''));
        array[index] = processNode(child);
      });
      return array;
    } else {
      // Object
      const obj: Record<string, any> = {};
      node.children.forEach(child => {
        obj[child.key] = processNode(child);
      });
      return obj;
    }
  }

  const result = data.children ? processNode(data) : data.value;
  return JSON.stringify(result, null, 2);
}