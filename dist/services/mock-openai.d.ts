import { RequestContext } from "../types/api";
export declare class MockOpenAIService {
    generateNaming(prompt: string, context?: RequestContext): Promise<string>;
    private generateMockResponse;
    private getMockSuggestions;
    private generateBaseNames;
    private extractKeywords;
    private applyNamingStyle;
    private toCamelCase;
    private toSnakeCase;
    private toPascalCase;
    private toKebabCase;
    private toUpperSnakeCase;
    private capitalize;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=mock-openai.d.ts.map