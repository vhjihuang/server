// src/services/naming/local/naming-generator.ts
import { StyleConverter } from './style-converter';
import { FrontendNamingType, NamingStyle } from '../types';

type GenerationInput = {
  baseTerms: string[];
  actionTerms: string[];
  type: FrontendNamingType;
  style: NamingStyle;
};

export class NamingGenerator {
  private readonly TYPE_SUFFIXES: Record<FrontendNamingType, string> = {
    component: '',
    hook: '',
    composable: '',
    store: '',
    util: '',
    type: 'Type',
    service: '',
    directive: '',
    enum: 'Enum',
    constant: '',
    page: '',
    layout: ''
  };

  generate(input: GenerationInput): string[] {
    const baseName = this.buildBaseName(input);
    const withSuffix = this.applySuffix(baseName, input.type);
    return this.generateVariations(withSuffix, input.style);
  }

  private buildBaseName(input: GenerationInput): string {
    const { baseTerms, actionTerms, type } = input;
    
    switch (type) {
      case 'util':
        return [...actionTerms, ...baseTerms].join('');
      case 'hook':
        return `use${baseTerms[0]?.toUpperCase() || ''}`;
      default:
        return baseTerms.join('');
    }
  }

  private applySuffix(name: string, type: FrontendNamingType): string {
    return name + this.TYPE_SUFFIXES[type];
  }

  private generateVariations(name: string, style: NamingStyle): string[] {
    const allStyles = StyleConverter.getAllStyles(name);
    return [
      allStyles[style],         // primary style
      allStyles.camelCase,      // fallback 1
      allStyles.PascalCase,     // fallback 2
      name                      // raw value
    ].filter((v, i, arr) => v && arr.indexOf(v) === i); // deduplicate
  }
}