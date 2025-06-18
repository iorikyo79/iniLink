import { UnifiedNode } from '../../types/unified';
import { js as beautify } from 'js-beautify';

export function serializeXmlContent(data: UnifiedNode): string {
  function processNode(node: UnifiedNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    
    if (!node.children || node.children.length === 0) {
      // Leaf node
      const value = node.value !== null && node.value !== undefined ? 
        escapeXml(String(node.value)) : '';
      return `${indent}<${node.key}>${value}</${node.key}>`;
    }

    // Container node
    let xml = `${indent}<${node.key}>`;
    
    if (node.children.length > 0) {
      xml += '\n';
      node.children.forEach(child => {
        xml += processNode(child, depth + 1) + '\n';
      });
      xml += indent;
    }
    
    xml += `</${node.key}>`;
    return xml;
  }

  function escapeXml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&apos;');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  if (data.children && data.children.length > 0) {
    // If there are multiple root children, wrap them
    if (data.children.length > 1) {
      xml += `<${data.key}>\n`;
      data.children.forEach(child => {
        xml += processNode(child, 1) + '\n';
      });
      xml += `</${data.key}>`;
    } else {
      xml += processNode(data.children[0], 0);
    }
  } else {
    xml += processNode(data, 0);
  }

  return xml;
}