import { Request, Response, NextFunction } from 'express';
import { OpenAIService } from '../services/openai';
import { GeminiService } from '../services/gemini';
import { MockOpenAIService } from '../services/mock-openai';
export declare class GenerateController {
    private openaiService;
    constructor(openaiService: OpenAIService | GeminiService | MockOpenAIService);
    generateNaming: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    healthCheck: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=generate.d.ts.map