import ini from 'ini';
import { IniData, IniSection, IniKey, IniChange } from '../types/ini';

export interface ValidationError {
  type: 'syntax' | 'duplicate_key' | 'invalid_section' | 'invalid_value' | 'empty_key' | 'reserved_word';
  message: string;
  line?: number;
  section?: string;
  key?: string;
  severity: 'error' | 'warning';
}

export function parseIniFile(content: string, filename: string): IniData {
  const validationErrors: ValidationError[] = [];
  
  try {
    // Pre-validation: Check for common INI syntax issues
    const preValidationErrors = validateIniSyntax(content);
    validationErrors.push(...preValidationErrors);

    const parsed = ini.parse(content);
    const sections: IniSection[] = [];

    // Track duplicate keys across sections
    const keyTracker = new Map<string, Set<string>>();

    // Handle root level keys (no section)
    const rootKeys: IniKey[] = [];
    const rootKeyNames = new Set<string>();
    
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        // Check for duplicate keys in root
        if (rootKeyNames.has(key)) {
          validationErrors.push({
            type: 'duplicate_key',
            message: `Duplicate key "${key}" found in root section`,
            section: '',
            key,
            severity: 'error'
          });
        }
        rootKeyNames.add(key);

        // Validate key name
        const keyValidationError = validateKeyName(key, '');
        if (keyValidationError) {
          validationErrors.push(keyValidationError);
        }

        // Validate value
        const inferredType = inferType(value);
        const valueValidationError = validateValueType(String(value), inferredType, '', key);
        
        rootKeys.push({
          key,
          value: String(value),
          originalValue: String(value),
          section: '',
          type: inferredType,
          isModified: false,
          error: valueValidationError?.message,
        });

        if (valueValidationError) {
          validationErrors.push(valueValidationError);
        }
      }
    });

    if (rootKeys.length > 0) {
      sections.push({
        name: 'Root',
        keys: rootKeys,
        isExpanded: true,
      });
    }

    // Handle sections
    Object.entries(parsed).forEach(([sectionName, sectionData]) => {
      if (typeof sectionData === 'object' && sectionData !== null) {
        // Validate section name
        const sectionValidationError = validateSectionName(sectionName);
        if (sectionValidationError) {
          validationErrors.push(sectionValidationError);
        }

        // Track keys in this section
        keyTracker.set(sectionName, new Set());
        const sectionKeyNames = new Set<string>();

        const keys: IniKey[] = Object.entries(sectionData).map(([key, value]) => {
          // Check for duplicate keys in section
          if (sectionKeyNames.has(key)) {
            validationErrors.push({
              type: 'duplicate_key',
              message: `Duplicate key "${key}" found in section "${sectionName}"`,
              section: sectionName,
              key,
              severity: 'error'
            });
          }
          sectionKeyNames.add(key);

          // Validate key name
          const keyValidationError = validateKeyName(key, sectionName);
          if (keyValidationError) {
            validationErrors.push(keyValidationError);
          }

          // Validate value
          const inferredType = inferType(value);
          const valueValidationError = validateValueType(String(value), inferredType, sectionName, key);
          
          const keyObj: IniKey = {
            key,
            value: String(value),
            originalValue: String(value),
            section: sectionName,
            type: inferredType,
            isModified: false,
            error: valueValidationError?.message,
          };

          if (valueValidationError) {
            validationErrors.push(valueValidationError);
          }

          return keyObj;
        });

        sections.push({
          name: sectionName,
          keys,
          isExpanded: true,
        });
      }
    });

    return {
      sections,
      raw: parsed,
      filename,
      validationErrors,
    };
  } catch (error) {
    throw new Error(`Failed to parse INI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateIniSyntax(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
      return;
    }
    
    // Check for section headers
    if (trimmedLine.startsWith('[')) {
      if (!trimmedLine.endsWith(']')) {
        errors.push({
          type: 'syntax',
          message: `Unclosed section header on line ${lineNumber}`,
          line: lineNumber,
          severity: 'error'
        });
      } else if (trimmedLine === '[]') {
        errors.push({
          type: 'invalid_section',
          message: `Empty section name on line ${lineNumber}`,
          line: lineNumber,
          severity: 'error'
        });
      }
      return;
    }
    
    // Check for key-value pairs
    if (!trimmedLine.includes('=')) {
      errors.push({
        type: 'syntax',
        message: `Invalid syntax on line ${lineNumber}: missing '=' separator`,
        line: lineNumber,
        severity: 'error'
      });
      return;
    }
    
    const [key] = trimmedLine.split('=', 2);
    if (!key.trim()) {
      errors.push({
        type: 'empty_key',
        message: `Empty key name on line ${lineNumber}`,
        line: lineNumber,
        severity: 'error'
      });
    }
  });
  
  return errors;
}

function validateSectionName(sectionName: string): ValidationError | null {
  // Check for empty section name
  if (!sectionName.trim()) {
    return {
      type: 'invalid_section',
      message: 'Section name cannot be empty',
      section: sectionName,
      severity: 'error'
    };
  }
  
  // Check for invalid characters
  const invalidChars = /[\[\]]/;
  if (invalidChars.test(sectionName)) {
    return {
      type: 'invalid_section',
      message: `Section name "${sectionName}" contains invalid characters ([ or ])`,
      section: sectionName,
      severity: 'error'
    };
  }
  
  // Check for reserved words (common INI reserved words)
  const reservedWords = ['DEFAULT', 'GLOBAL', 'ROOT'];
  if (reservedWords.includes(sectionName.toUpperCase())) {
    return {
      type: 'reserved_word',
      message: `Section name "${sectionName}" is a reserved word`,
      section: sectionName,
      severity: 'warning'
    };
  }
  
  return null;
}

function validateKeyName(keyName: string, sectionName: string): ValidationError | null {
  // Check for empty key name
  if (!keyName.trim()) {
    return {
      type: 'empty_key',
      message: 'Key name cannot be empty',
      section: sectionName,
      key: keyName,
      severity: 'error'
    };
  }
  
  // Check for invalid characters
  const invalidChars = /[=\[\]]/;
  if (invalidChars.test(keyName)) {
    return {
      type: 'invalid_value',
      message: `Key name "${keyName}" contains invalid characters (=, [, or ])`,
      section: sectionName,
      key: keyName,
      severity: 'error'
    };
  }
  
  // Check for leading/trailing whitespace
  if (keyName !== keyName.trim()) {
    return {
      type: 'invalid_value',
      message: `Key name "${keyName}" has leading or trailing whitespace`,
      section: sectionName,
      key: keyName,
      severity: 'warning'
    };
  }
  
  return null;
}

function validateValueType(value: string, type: 'string' | 'number' | 'boolean', sectionName: string, keyName: string): ValidationError | null {
  switch (type) {
    case 'boolean':
      const boolValue = value.toLowerCase();
      if (!['true', 'false', 'yes', 'no', 'on', 'off', 't', 'n'].includes(boolValue)) {
        return {
          type: 'invalid_value',
          message: `Invalid boolean value "${value}" for key "${keyName}". Expected: True/TRUE/T, No/NO/N, yes/no, on/off`,
          section: sectionName,
          key: keyName,
          severity: 'error'
        };
      }
      break;
      
    case 'number':
      if (isNaN(Number(value)) || value.trim() === '') {
        return {
          type: 'invalid_value',
          message: `Invalid number value "${value}" for key "${keyName}"`,
          section: sectionName,
          key: keyName,
          severity: 'error'
        };
      }
      
      // Check for potential precision issues
      const numValue = Number(value);
      if (!Number.isFinite(numValue)) {
        return {
          type: 'invalid_value',
          message: `Number value "${value}" for key "${keyName}" is not finite`,
          section: sectionName,
          key: keyName,
          severity: 'error'
        };
      }
      break;
      
    case 'string':
      // Check for potentially problematic string values
      if (value.includes('\n') || value.includes('\r')) {
        return {
          type: 'invalid_value',
          message: `String value for key "${keyName}" contains line breaks`,
          section: sectionName,
          key: keyName,
          severity: 'warning'
        };
      }
      break;
  }
  
  return null;
}

export function serializeIniData(data: IniData): string {
  const result: Record<string, any> = {};

  data.sections.forEach(section => {
    if (section.name === 'Root') {
      section.keys.forEach(key => {
        result[key.key] = parseValue(key.value, key.type);
      });
    } else {
      if (!result[section.name]) {
        result[section.name] = {};
      }
      section.keys.forEach(key => {
        result[section.name][key.key] = parseValue(key.value, key.type);
      });
    }
  });

  return ini.stringify(result);
}

export function generateChangeLog(changes: IniChange[]): string {
  if (changes.length === 0) {
    return 'No changes made.';
  }

  let log = `INI File Change Log\n`;
  log += `Generated: ${new Date().toISOString()}\n`;
  log += `Total Changes: ${changes.length}\n\n`;

  changes.forEach((change, index) => {
    log += `${index + 1}. ${change.type.toUpperCase()}\n`;
    
    switch (change.type) {
      case 'add_section':
        log += `   Added Section: ${change.section}\n`;
        break;
      case 'delete_section':
        log += `   Deleted Section: ${change.section}\n`;
        log += `   Details: ${change.oldValue}\n`;
        break;
      case 'add':
        log += `   Section: ${change.section || 'Root'}\n`;
        log += `   Added Key: ${change.key}\n`;
        log += `   Value: ${change.newValue}\n`;
        break;
      case 'delete':
        log += `   Section: ${change.section || 'Root'}\n`;
        log += `   Deleted Key: ${change.key}\n`;
        log += `   Previous Value: ${change.oldValue}\n`;
        break;
      default:
        log += `   Section: ${change.section || 'Root'}\n`;
        log += `   Key: ${change.key}\n`;
        log += `   Old Value: ${change.oldValue}\n`;
        log += `   New Value: ${change.newValue}\n`;
        break;
    }
    
    log += `   Timestamp: ${change.timestamp.toISOString()}\n`;
    if (change.comment) {
      log += `   Comment: ${change.comment}\n`;
    }
    log += '\n';
  });

  return log;
}

function inferType(value: any): 'string' | 'number' | 'boolean' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    
    // Check for specific boolean values first (case-insensitive)
    const lowerValue = trimmedValue.toLowerCase();
    if (['true', 'yes', 'on', 't'].includes(lowerValue) || 
        ['no', 'n'].includes(lowerValue)) {
      return 'boolean';
    }
    
    // Check for uppercase boolean values
    const upperValue = trimmedValue.toUpperCase();
    if (['TRUE', 'NO', 'T', 'N'].includes(upperValue)) {
      return 'boolean';
    }
    
    // Check for numbers (including 0 and 1, but treat them as numbers)
    if (!isNaN(Number(trimmedValue)) && trimmedValue !== '' && isFinite(Number(trimmedValue))) {
      return 'number';
    }
  }
  return 'string';
}

function parseValue(value: string, type: 'string' | 'number' | 'boolean'): any {
  switch (type) {
    case 'boolean':
      const lowerValue = value.toLowerCase();
      const upperValue = value.toUpperCase();
      return ['true', 'yes', 'on', 't'].includes(lowerValue) || 
             ['TRUE', 'T'].includes(upperValue);
    case 'number':
      return Number(value);
    default:
      return value;
  }
}

export function validateValue(value: string, type: 'string' | 'number' | 'boolean'): string | null {
  switch (type) {
    case 'boolean':
      const lowerValue = value.toLowerCase();
      const upperValue = value.toUpperCase();
      if (!['true', 'yes', 'no', 'on', 'off', 't', 'n'].includes(lowerValue) &&
          !['TRUE', 'NO', 'T', 'N'].includes(upperValue)) {
        return 'Boolean values must be: True/TRUE/T, No/NO/N, yes/no, or on/off';
      }
      break;
    case 'number':
      if (isNaN(Number(value)) || value.trim() === '') {
        return 'Must be a valid number';
      }
      if (!Number.isFinite(Number(value))) {
        return 'Number must be finite';
      }
      break;
    case 'string':
      if (value.includes('\n') || value.includes('\r')) {
        return 'String values cannot contain line breaks';
      }
      break;
  }
  return null;
}

export function getValidationSummary(errors: ValidationError[]): {
  errorCount: number;
  warningCount: number;
  criticalIssues: ValidationError[];
} {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const criticalIssues = errors.filter(e => 
    e.type === 'syntax' || 
    e.type === 'duplicate_key' || 
    (e.type === 'invalid_value' && e.severity === 'error')
  );

  return {
    errorCount,
    warningCount,
    criticalIssues
  };
}