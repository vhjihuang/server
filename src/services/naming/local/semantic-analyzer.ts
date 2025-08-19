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
      // logger.info("开始语义分析", { text });

      const doc = nlp.readDoc(text || "");

      // 获取所有tokens和词性标记（忽略类型检查）
      // @ts-ignore
      const posTags: string[] = doc.tokens().out(its.pos);
      // @ts-ignore
      const tokens: string[] = doc.tokens().out();

      const nounItems: string[] = [];
      const verbItems: string[] = [];

      // 遍历tokens和词性标记
      for (let i = 0; i < posTags.length; i++) {
        const pos = posTags[i];
        const tokenValue = tokens[i];
        
        if (pos === "NOUN") {
          nounItems.push(tokenValue);
        } else if (pos === "VERB") {
          verbItems.push(tokenValue);
        }
      }

      // logger.info("分析结果", { nouns: nounItems, verbs: verbItems });

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