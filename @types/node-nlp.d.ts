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