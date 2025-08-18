declare module 'wink-nlp' {
  interface Its {
    // 词性标注
    pos(): string;
    // 词元
    lemma(): string;
    // 命名实体类型
    type(): string;
    // 语义角色标签
    role(): string;
  }

  interface Item {
    // 获取词的文本
    text(): string;
    // 获取词的属性
    its: Its;
  }

  interface Selection {
    // 获取选择项的数组
    out(): Item[];
    // 获取选择项的数组（带参数）
    out<T>(format: string): T[];
  }

  interface Document {
    // 读取文档文本
    text(): string;
    // 获取标记
    tokens(): Selection;
    // 获取句子
    sentences(): Selection;
    // 获取实体
    entities(): Selection;
    // 获取词性标注
    pos(): Selection;
  }

  interface WinkNLP {
    // 读取文档
    readDoc(text: string): Document;
    // its对象
    its: Its;
  }

  // 默认导出函数
  export default function winkNLP(model: any): WinkNLP;
}

declare module 'node-nlp' {
  export class NlpManager {
    constructor(options: { languages: string[] });
    container: Container;
    useChinese(): void;
    tokenize(text: string): string[];
  }
  
  export class Container {
    useChinese(): void;
    tokenize(text: string): string[];
  }
  
  export function containerBootstrap(): Container;
}