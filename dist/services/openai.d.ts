import { RequestContext } from '../types/api';
export declare class OpenAIService {
    private client;
    constructor(apiKey: string);
    generateNaming(prompt: string, context?: RequestContext): Promise<string>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=openai.d.ts.map