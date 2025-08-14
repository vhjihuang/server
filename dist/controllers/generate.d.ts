import { Request, Response, NextFunction } from 'express';
import { OpenAIService } from '../services/openai';
export declare class GenerateController {
    private openaiService;
    constructor(openaiService: OpenAIService);
    generateNaming: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    healthCheck: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=generate.d.ts.map