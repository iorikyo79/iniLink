import { UnifiedNode, ValidationRule, ValidationError } from '../types/unified';

export class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();

  addRule(path: string, rule: ValidationRule): void {
    if (!this.rules.has(path)) {
      this.rules.set(path, []);
    }
    this.rules.get(path)!.push(rule);
  }

  removeRule(path: string): void {
    this.rules.delete(path);
  }

  validateNode(node: UnifiedNode): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validate current node
    const nodeRules = this.rules.get(node.path) || [];
    nodeRules.forEach(rule => {
      const error = this.validateValue(node.value, rule, node.path);
      if (error) {
        errors.push(error);
      }
    });

    // Validate children recursively
    if (node.children) {
      node.children.forEach(child => {
        errors.push(...this.validateNode(child));
      });
    }

    return errors;
  }

  private validateValue(value: any, rule: ValidationRule, path: string): ValidationError | null {
    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return {
        path,
        message: rule.message || 'This field is required',
        severity: 'error',
        type: 'required'
      };
    }

    // Skip other validations if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return {
        path,
        message: rule.message || `Minimum length is ${rule.minLength}`,
        severity: 'error',
        type: 'minLength'
      };
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return {
        path,
        message: rule.message || `Maximum length is ${rule.maxLength}`,
        severity: 'error',
        type: 'maxLength'
      };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return {
        path,
        message: rule.message || 'Value does not match required pattern',
        severity: 'error',
        type: 'pattern'
      };
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return {
        path,
        message: rule.message || 'Custom validation failed',
        severity: 'error',
        type: 'custom'
      };
    }

    return null;
  }
}

export function validateDataType(value: any, expectedType: string): ValidationError | null {
  const actualType = typeof value;
  
  switch (expectedType) {
    case 'number':
      if (actualType !== 'number' || isNaN(value) || !isFinite(value)) {
        return {
          path: '',
          message: 'Value must be a valid number',
          severity: 'error',
          type: 'dataType'
        };
      }
      break;
    case 'boolean':
      if (actualType !== 'boolean') {
        const stringValue = String(value).toLowerCase();
        if (!['true', 'false', 'yes', 'no', 'on', 'off', '1', '0'].includes(stringValue)) {
          return {
            path: '',
            message: 'Value must be a valid boolean',
            severity: 'error',
            type: 'dataType'
          };
        }
      }
      break;
    case 'string':
      if (actualType !== 'string') {
        return {
          path: '',
          message: 'Value must be a string',
          severity: 'warning',
          type: 'dataType'
        };
      }
      break;
  }

  return null;
}

export function sanitizeValue(value: any, targetType: string): any {
  switch (targetType) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    case 'boolean':
      if (typeof value === 'boolean') return value;
      const stringValue = String(value).toLowerCase();
      return ['true', 'yes', 'on', '1'].includes(stringValue);
    case 'string':
      return String(value);
    default:
      return value;
  }
}