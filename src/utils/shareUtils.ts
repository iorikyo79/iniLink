import LZString from 'lz-string';
import { ShareData } from '../types/unified';

export function generateShareUrl(shareData: ShareData): { url: string; length: number } {
  try {
    // Compress the data
    const jsonString = JSON.stringify(shareData);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    
    // Generate URL
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?config=${compressed}`;
    
    return {
      url: shareUrl,
      length: shareUrl.length
    };
  } catch (error) {
    throw new Error(`Failed to generate share URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseShareUrl(): ShareData | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    
    if (!configParam) {
      return null;
    }

    // Decompress the data
    const decompressed = LZString.decompressFromEncodedURIComponent(configParam);
    
    if (!decompressed) {
      throw new Error('Failed to decompress share data');
    }

    // Parse JSON
    const shareData: ShareData = JSON.parse(decompressed);
    
    // Validate share data structure
    if (!shareData.version || !shareData.content || !shareData.filename || !shareData.fileType) {
      throw new Error('Invalid share data structure');
    }

    return shareData;
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    throw new Error(`Failed to parse shared configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function clearShareUrl(): void {
  // Remove the config parameter from URL without page reload
  const url = new URL(window.location.href);
  url.searchParams.delete('config');
  window.history.replaceState({}, document.title, url.toString());
}

export function validateShareData(shareData: ShareData): boolean {
  try {
    // Check required fields
    if (!shareData.version || !shareData.content || !shareData.filename || !shareData.fileType) {
      return false;
    }

    // Check file type
    if (!['ini', 'json', 'xml'].includes(shareData.fileType)) {
      return false;
    }

    // Validate timestamp if present
    if (shareData.metadata?.created && (typeof shareData.metadata.created !== 'string' && !(shareData.metadata.created instanceof Date))) {
      return false;
    }

    // Try to validate content format
    if (typeof shareData.content !== 'string' || shareData.content.trim().length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Share data validation failed:', error);
    return false;
  }
}