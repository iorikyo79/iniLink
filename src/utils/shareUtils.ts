import LZString from 'lz-string';
import { IniData } from '../types/ini';
import { serializeIniData } from './iniParser';

export interface ShareData {
  version: string;
  timestamp: number;
  filename: string;
  data: string; // Serialized INI content
}

export function generateShareUrl(iniData: IniData): { url: string; length: number } {
  try {
    // Create clean INI data without change history and comments
    const cleanData: IniData = {
      ...iniData,
      sections: iniData.sections.map(section => ({
        ...section,
        keys: section.keys.map(key => ({
          ...key,
          comment: undefined, // Remove comments for sharing
          isModified: false,  // Reset modification status
        }))
      }))
    };

    // Serialize the INI data
    const serializedData = serializeIniData(cleanData);
    
    // Create share data object
    const shareData: ShareData = {
      version: '1.0',
      timestamp: Date.now(),
      filename: iniData.filename,
      data: serializedData
    };

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
    if (!shareData.version || !shareData.data || !shareData.filename) {
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
    if (!shareData.version || !shareData.data || !shareData.filename) {
      return false;
    }

    // Check version compatibility
    if (shareData.version !== '1.0') {
      console.warn(`Share data version ${shareData.version} may not be fully compatible`);
    }

    // Validate timestamp
    if (shareData.timestamp && (typeof shareData.timestamp !== 'number' || shareData.timestamp <= 0)) {
      return false;
    }

    // Try to validate INI data format
    if (typeof shareData.data !== 'string' || shareData.data.trim().length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Share data validation failed:', error);
    return false;
  }
}

export function getShareUrlInfo(url: string): {
  isValid: boolean;
  length: number;
  estimatedSize: number;
  compressionRatio?: number;
} {
  try {
    const urlObj = new URL(url);
    const configParam = urlObj.searchParams.get('config');
    
    if (!configParam) {
      return { isValid: false, length: url.length, estimatedSize: 0 };
    }

    // Try to decompress to get original size
    let originalSize = 0;
    let compressionRatio = 0;
    
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(configParam);
      if (decompressed) {
        originalSize = decompressed.length;
        compressionRatio = configParam.length / originalSize;
      }
    } catch (error) {
      // Ignore decompression errors for info purposes
    }

    return {
      isValid: true,
      length: url.length,
      estimatedSize: originalSize,
      compressionRatio: compressionRatio > 0 ? compressionRatio : undefined
    };
  } catch (error) {
    return { isValid: false, length: url.length, estimatedSize: 0 };
  }
}