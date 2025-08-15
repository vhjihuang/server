import { RequestContext } from '../types/api';
export declare class GeminiService {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    generateNaming(prompt: string, context?: RequestContext): Promise<string>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=gemini.d.ts.map