// src/services/naming/local/naming-generator.ts
import { camelCase, pascalCase, kebabCase, constantCase } from 'change-case';
import nlp from 'compromise';
import pluralize from 'pluralize';
import { FrontendNamingType, NamingStyle } from '../types';

type GenerationInput = {
  baseTerms: string[];
  actionTerms: string[];
  type: FrontendNamingType | 'function';
  style: NamingStyle | 'auto';
};

export class NamingGenerator {
  private readonly TYPE_SUFFIXES: Record<FrontendNamingType | 'function', string> = {
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
    layout: '',
    function: ''
  };

  private readonly DEFAULT_STYLES: Record<FrontendNamingType | 'function', NamingStyle> = {
    component: 'PascalCase',
    hook: 'camelCase',
    composable: 'camelCase',
    store: 'camelCase',
    util: 'camelCase',
    type: 'PascalCase',
    service: 'camelCase',
    directive: 'camelCase',
    enum: 'PascalCase',
    constant: 'CONSTANT_CASE',
    page: 'PascalCase',
    layout: 'PascalCase',
    function: 'camelCase'
  };

  generate(input: GenerationInput): string[] {
    const baseName = this.buildBaseName(input);
    const withSuffix = this.applySuffix(baseName, input.type as FrontendNamingType);
    const style = input.style === 'auto' ? this.DEFAULT_STYLES[input.type as FrontendNamingType] : input.style as NamingStyle;
    return this.generateVariations(withSuffix, style);
  }

  parseNaturalLanguage(input: string): GenerationInput {
    const doc = nlp(input.toLowerCase());
    
    // 提取动作词（动词）
    const actionTerms = doc.verbs().out('array')
      .filter((verb: string) => !['be', 'have', 'do'].includes(verb))
      .map((verb: string) => this.stemWord(verb));

    // 提取主体名词（处理复合名词）
    const baseTerms = doc.nouns().out('array')
      .flatMap((term: string) => term.split(/[\s\-_]+/))
      .filter((term: string) => term.length > 2 && !this.isStopWord(term))
      .map((term: string) => pluralize.singular(this.stemWord(term)));

    // 智能检测类型
    const detectedType = this.detectTypeFromText(input) || ('function' as const);

    return {
      baseTerms: baseTerms.length ? baseTerms : ['entity'],
      actionTerms: actionTerms.length ? actionTerms : ['handle'],
      type: detectedType,
      style: 'auto'
    };
  }

  private buildBaseName(input: GenerationInput): string {
    const { baseTerms, actionTerms, type } = input;
    
    switch (type) {
      case 'hook':
        return `use${this.capitalize(baseTerms[0] || '')}`;
      case 'component':
      case 'page':
      case 'layout':
        return baseTerms.map(term => this.capitalize(term)).join('');
      case 'type':
      case 'enum':
        return `${baseTerms.map(term => this.capitalize(term)).join('')}`;
      case 'constant':
        return baseTerms.join('_').toUpperCase();
      case 'util':
      case 'function':
      case 'service':
        return [...actionTerms, ...baseTerms].map(term => this.capitalize(term)).join('');
      default:
        return baseTerms.join('');
    }
  }

  private applySuffix(name: string, type: FrontendNamingType | 'function'): string {
    const suffix = this.TYPE_SUFFIXES[type];
    if (!suffix || name.endsWith(suffix)) return name;
    return name + suffix;
  }

  private generateVariations(name: string, style: NamingStyle): string[] {
    const variations = new Set<string>();
    
    // 添加主要风格
    switch (style) {
      case 'camelCase': variations.add(camelCase(name)); break;
      case 'PascalCase': variations.add(pascalCase(name)); break;
      case 'kebab-case': variations.add(kebabCase(name)); break;
      case 'CONSTANT_CASE': variations.add(constantCase(name)); break;
      default: variations.add(camelCase(name));
    }

    // 添加常见备用风格
    if (style !== 'camelCase') variations.add(camelCase(name));
    if (style !== 'PascalCase') variations.add(pascalCase(name));
    
    // 保留原始名称（如果不同）
    if (!variations.has(name)) variations.add(name);
    
    return Array.from(variations);
  }

  private detectTypeFromText(text: string): FrontendNamingType | null {
    const doc = nlp(text.toLowerCase());
    const typeMap: Record<string, FrontendNamingType> = {
      'component': 'component',
      'hook': 'hook',
      'utility': 'util',
      'service': 'service',
      'type': 'type',
      'enum': 'enum',
      'constant': 'constant',
      'page': 'page',
      'layout': 'layout',
      'function': 'util' // 将function映射到util类型
    };

    const found = doc.match(Object.keys(typeMap).join('|')).out('array');
    return found.length ? typeMap[found[0]] : null;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'for', 'to', 'of', 'and'];
    return stopWords.includes(word);
  }

  private stemWord(word: string): string {
    // 简单词干提取（可用natural库增强）
    return word.replace(/ing$|s$|es$/, '');
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}