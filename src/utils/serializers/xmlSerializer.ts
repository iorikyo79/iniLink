import { UnifiedNode } from '../../types/unified';
import { js as beautify } from 'js-beautify';

export function serializeXmlContent(data: UnifiedNode): string {
  function processNode(node: UnifiedNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    
    // 속성과 텍스트 노드를 분리
    const attributes: UnifiedNode[] = [];
    const textNodes: UnifiedNode[] = [];
    const elementNodes: UnifiedNode[] = [];
    
    if (node.children) {
      node.children.forEach(child => {
        if (child.key.startsWith('@')) {
          attributes.push(child);
        } else if (child.key === 'text' || child.key === '#text') {
          textNodes.push(child);
        } else {
          elementNodes.push(child);
        }
      });
    }
    
    // 속성 문자열 생성
    let attributeString = '';
    attributes.forEach(attr => {
      const attrName = attr.key.substring(1); // '@' 제거
      const attrValue = attr.value !== null && attr.value !== undefined ? 
        escapeXml(String(attr.value)) : '';
      attributeString += ` ${attrName}="${attrValue}"`;
    });
    
    // 텍스트 내용 수집
    let textContent = '';
    textNodes.forEach(textNode => {
      if (textNode.value !== null && textNode.value !== undefined) {
        textContent += escapeXml(String(textNode.value));
      }
    });
    
    // 리프 노드 (자식 요소가 없고 텍스트만 있는 경우)
    if (elementNodes.length === 0) {
      const value = node.value !== null && node.value !== undefined ? 
        escapeXml(String(node.value)) : textContent;
      return `${indent}<${node.key}${attributeString}>${value}</${node.key}>`;
    }

    // 컨테이너 노드
    let xml = `${indent}<${node.key}${attributeString}>`;
    
    // 텍스트 내용이 있으면 추가
    if (textContent) {
      xml += textContent;
    }
    
    if (elementNodes.length > 0) {
      if (!textContent) {
        xml += '\n';
      }
      elementNodes.forEach(child => {
        xml += processNode(child, depth + 1) + '\n';
      });
      if (!textContent) {
        xml += indent;
      }
    }
    
    xml += `</${node.key}>`;
    return xml;
  }

  function escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  if (data.children && data.children.length > 0) {
    // 여러 루트 자식이 있으면 래핑
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