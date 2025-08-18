// src/services/naming/local/semantic-analyzer.ts
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { stemmer } from "stemmer";
import { logger } from "../../logger";

const nlp = winkNLP(model);
const its = nlp.its;

export class SemanticAnalyzer {
  async extractKeywords(text: string): Promise<{
    baseTerms: string[];
    actionTerms: string[];
  }> {
    try {
      logger.info("开始语义分析", { text });

      const doc = nlp.readDoc(text || "");

      const nounItems: string[] = [];
      const verbItems: string[] = [];
      
      // 使用 out() 方法获取 tokens 数组，然后遍历
      const tokens = doc.tokens().out();
      tokens.forEach((token: any) => {
        // 根据类型定义，应该使用 token.its.pos() 获取词性
        if (token.its.pos() === "NOUN") {
          // 使用 token.text() 获取文本
          nounItems.push(token.text());
        } else if (token.its.pos() === "VERB") {
          // 使用 token.text() 获取文本
          verbItems.push(token.text());
        }
      });

      logger.info("分析结果", { nouns: nounItems, verbs: verbItems });

      return {
        baseTerms: nounItems.map((term: string) => stemmer(term.toLowerCase())),
        actionTerms: verbItems.map((term: string) => stemmer(term.toLowerCase()))
      };
    } catch (error: any) {
      logger.error("语义分析失败", error);
      return { baseTerms: [], actionTerms: [] };
    }
  }
}