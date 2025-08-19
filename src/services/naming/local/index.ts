// src/services/naming/local/index.ts
import { SemanticAnalyzer } from './semantic-analyzer';
import { NamingGenerator } from './naming-generator';
import { FrontendNamingType, NamingStyle } from '../types';
import { logger } from "../../logger";
export interface LocalNamingResult {
  suggestions: string[];
  confidence: number;
}

export class LocalNamingEngine {
  private analyzer = new SemanticAnalyzer();
  private generator = new NamingGenerator();

  async generateNames(
    prompt: string,
    type: FrontendNamingType,
    options: { style: NamingStyle }
  ): Promise<LocalNamingResult> {
    try {
      console.log('local/index.ts:', prompt )
      const { baseTerms, actionTerms } = await this.analyzer.extractKeywords(prompt);
      console.log('local/index.ts extractKeywords:', baseTerms, actionTerms )
      if (baseTerms.length === 0) {
        return { suggestions: [], confidence: 0 };
      }

       if (!baseTerms?.length) { // 更安全的空值检查
        logger.warn('未提取到有效基础术语', { prompt });
        return { suggestions: ['default' + type], confidence: 0.5 };
      }

      const suggestions = this.generator.generate({
        baseTerms,
        actionTerms,
        type,
        style: options.style
      });
      return {
        suggestions,
        confidence: Math.min(0.9, baseTerms.length * 0.3) // 简单置信度计算
      };
    } catch (error) {
      return { suggestions: [], confidence: 0 };
    }
  }
}