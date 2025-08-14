import { GenerateRequest } from '../types/api';
export declare class ValidationService {
    static validateGenerateRequest(data: any): GenerateRequest;
    static validateEnvironment(): void;
    static validateOpenAIResponse(response: string): string[];
}
//# sourceMappingURL=validator.d.ts.map