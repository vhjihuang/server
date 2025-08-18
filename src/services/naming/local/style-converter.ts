// src/services/naming/local/style-converter.ts
import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase
} from 'change-case';
import { NamingStyle } from '../types';

export class StyleConverter {
  static convert(text: string, style: NamingStyle): string {
    switch (style) {
      case 'camelCase': return camelCase(text);
      case 'PascalCase': return capitalCase(text).replace(/\s+/g, '');
      case 'snake_case': return constantCase(text).toLowerCase();
      case 'kebab-case': return kebabCase(text);
      case 'CONSTANT_CASE': return constantCase(text);
      case 'flatcase': return text.toLowerCase().replace(/[^a-z0-9]/g, ''); // 添加flatcase支持
      default: return camelCase(text);
    }
  }

  static getAllStyles(text: string): Record<NamingStyle, string> {
    return {
      camelCase: this.convert(text, 'camelCase'),
      PascalCase: this.convert(text, 'PascalCase'),
      snake_case: this.convert(text, 'snake_case'),
      'kebab-case': this.convert(text, 'kebab-case'),
      CONSTANT_CASE: this.convert(text, 'CONSTANT_CASE'),
      flatcase: this.convert(text, 'flatcase') // 添加flatcase支持
    };
  }
}