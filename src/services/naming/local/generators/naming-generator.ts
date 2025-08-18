import { uniq, sampleSize } from 'lodash';
import type { 
  SemanticAnalysisResult, 
  FrontendNamingType, 
  NamingStyle
} from '../../types';
import { StyleConverter } from './style-converter';

export class NamingGenerator {
  private styleConverter: StyleConverter;
  
  constructor() {
    this.styleConverter = new StyleConverter();
  }
  
  generate(
    semanticResult: SemanticAnalysisResult,
    type: FrontendNamingType,
    style: NamingStyle,
    count: number
  ): string[] {
    // 基于丰富的语义分析结果生成命名候选项
    const candidates = this.generateSemanticCandidates(semanticResult, type);
    
    // 应用风格转换
    const styledNames = candidates.map(candidate => 
      this.styleConverter.convert(candidate, style)
    );
    
    // 去重并返回指定数量的结果
    return sampleSize(uniq(styledNames), count);
  }
  
  private generateSemanticCandidates(
    semanticResult: SemanticAnalysisResult,
    type: FrontendNamingType
  ): string[] {
    const { 
      verbs, 
      nouns, 
      adjectives, 
      relationships, 
      semanticRoles, 
      namedEntities,
      posTags 
    } = semanticResult as Required<SemanticAnalysisResult>;
    
    const candidates: string[] = [];
    
    // 1. 基于语义角色生成命名
    if (semanticRoles['action'] && semanticRoles['object']) {
      const actions = semanticRoles['action'] as string[];
      const objects = semanticRoles['object'] as string[];
      
      actions.forEach(action => {
        objects.forEach(object => {
          candidates.push(`${action} ${object}`);
        });
      });
    }
    
    // 2. 基于命名实体生成命名
    if (namedEntities) {
      Object.values(namedEntities).forEach((entities: string[]) => {
        candidates.push(...entities);
      });
    }
    
    // 3. 基于词性标记生成命名
    if (posTags) {
      // 使用动词和名词组合
      const posVerbs = posTags['VERB'] || [];
      const posNouns = posTags['NOUN'] || [];
      
      posVerbs.forEach(verb => {
        posNouns.forEach(noun => {
          candidates.push(`${verb} ${noun}`);
        });
      });
    }
    
    // 4. 基于类型生成特定模式的命名
    // eslint-disable-next-line default-case
    switch (type) {
      case 'component':
        candidates.push(...this.generateComponentPatterns(semanticResult));
        break;
      case 'hook':
        candidates.push(...this.generateHookPatterns(semanticResult));
        break;
      case 'service':
        candidates.push(...this.generateServicePatterns(semanticResult));
        break;
      case 'util':
        candidates.push(...this.generateUtilPatterns(semanticResult));
        break;
      case 'store':
        candidates.push(...this.generateStorePatterns(semanticResult));
        break;
      default:
        candidates.push(...this.generateGenericPatterns(semanticResult));
    }
    
    // 5. 添加基础词汇组合
    candidates.push(...this.generateBasicCombinations(semanticResult));
    
    // 6. 如果没有生成任何候选，使用基础组合
    if (candidates.length === 0 && (verbs.length > 0 || nouns.length > 0)) {
      candidates.push(...this.generateFallbackCombinations(semanticResult));
    }
    
    return candidates;
  }
  
  private generateComponentPatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { nouns, adjectives, namedEntities } = semanticResult;
    const patterns: string[] = [];
    
    // 形容词 + 名词 组件
    if (adjectives.length > 0 && nouns.length > 0) {
      adjectives.forEach(adj => {
        nouns.forEach(noun => {
          patterns.push(`${adj} ${noun}`);
        });
      });
    }
    
    // 基于命名实体的组件名
    if (namedEntities && namedEntities['PERSON']) {
      namedEntities['PERSON'].forEach((person: string) => {
        patterns.push(`${person} Profile`);
        patterns.push(`${person} Card`);
      });
    }
    
    // 名词组件
    patterns.push(...nouns);
    
    return patterns;
  }
  
  private generateHookPatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns, semanticRoles } = semanticResult;
    const patterns: string[] = [];
    
    // use + 动词 + 名词
    if (verbs.length > 0 && nouns.length > 0) {
      verbs.forEach(verb => {
        nouns.forEach(noun => {
          patterns.push(`use ${verb} ${noun}`);
        });
      });
    }
    
    // use + 语义角色中的对象
    if (semanticRoles['object']) {
      semanticRoles['object'].forEach((object: string) => {
        patterns.push(`use ${object}`);
        patterns.push(`use ${object} Data`);
      });
    }
    
    // use + 名词
    patterns.push(...nouns.map(noun => `use ${noun}`));
    
    return patterns;
  }
  
  private generateServicePatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns, semanticRoles } = semanticResult;
    const patterns: string[] = [];
    
    // 动词 + 名词 + Service
    if (verbs.length > 0 && nouns.length > 0) {
      verbs.forEach(verb => {
        nouns.forEach(noun => {
          patterns.push(`${verb} ${noun} Service`);
        });
      });
    }
    
    // 基于语义角色的服务名
    if (semanticRoles['action'] && semanticRoles['action'].length > 0) {
      semanticRoles['action'].forEach((action: string) => {
        patterns.push(`${action} Service`);
      });
    }
    
    // 名词 + Service
    patterns.push(...nouns.map(noun => `${noun} Service`));
    
    return patterns;
  }
  
  private generateUtilPatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns, adjectives } = semanticResult;
    const patterns: string[] = [];
    
    // 动词 + 名词 + Util
    if (verbs.length > 0 && nouns.length > 0) {
      verbs.forEach(verb => {
        nouns.forEach(noun => {
          patterns.push(`${verb} ${noun} Util`);
        });
      });
    }
    
    // 形容词 + 名词 + Util
    if (adjectives.length > 0 && nouns.length > 0) {
      adjectives.forEach(adj => {
        nouns.forEach(noun => {
          patterns.push(`${adj} ${noun} Util`);
        });
      });
    }
    
    return patterns;
  }
  
  private generateStorePatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { nouns, namedEntities } = semanticResult;
    const patterns: string[] = [];
    
    // 名词 + Store
    patterns.push(...nouns.map(noun => `${noun} Store`));
    
    // use + 名词 + Store
    patterns.push(...nouns.map(noun => `use ${noun} Store`));
    
    // 基于命名实体的 Store
    if (namedEntities) {
      Object.values(namedEntities).forEach(entities => {
        entities.forEach((entity: string) => {
          patterns.push(`${entity} Store`);
        });
      });
    }
    
    return patterns;
  }
  
  private generateGenericPatterns(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns, adjectives, semanticRoles } = semanticResult;
    const patterns: string[] = [];
    
    // 动词 + 名词
    if (verbs.length > 0 && nouns.length > 0) {
      verbs.forEach(verb => {
        nouns.forEach(noun => {
          patterns.push(`${verb} ${noun}`);
        });
      });
    }
    
    // 形容词 + 名词
    if (adjectives.length > 0 && nouns.length > 0) {
      adjectives.forEach(adj => {
        nouns.forEach(noun => {
          patterns.push(`${adj} ${noun}`);
        });
      });
    }
    
    // 基于语义角色的组合
    if (semanticRoles['action'] && semanticRoles['object']) {
      semanticRoles['action'].forEach((action: string) => {
        semanticRoles['object'].forEach((object: string) => {
          patterns.push(`${action} ${object}`);
        });
      });
    }
    
    // 单独名词
    patterns.push(...nouns);
    
    return patterns;
  }
  
  private generateBasicCombinations(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns, adjectives } = semanticResult;
    const combinations: string[] = [];
    
    // 简单的两词组合
    verbs.forEach(verb => {
      nouns.forEach(noun => {
        combinations.push(`${verb} ${noun}`);
      });
    });
    
    adjectives.forEach(adj => {
      nouns.forEach(noun => {
        combinations.push(`${adj} ${noun}`);
      });
    });
    
    return combinations;
  }
  
  private generateFallbackCombinations(semanticResult: SemanticAnalysisResult): string[] {
    const { verbs, nouns } = semanticResult;
    const combinations: string[] = [];
    
    // 当其他方法都失败时，使用最基础的组合
    if (verbs.length > 0 && nouns.length > 0) {
      // 动词+名词组合
      verbs.forEach(verb => {
        nouns.forEach(noun => {
          combinations.push(`${verb} ${noun}`);
          combinations.push(`${verb}${noun.charAt(0).toUpperCase() + noun.slice(1)}`);
        });
      });
    } else if (nouns.length > 0) {
      // 只有名词时，直接使用名词
      combinations.push(...nouns);
    } else if (verbs.length > 0) {
      // 只有动词时，直接使用动词
      combinations.push(...verbs);
    }
    
    return combinations;
  }
}