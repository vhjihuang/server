import express from 'express';
declare class App {
    private app;
    private config;
    private openaiService;
    private generateController;
    constructor();
    private loadConfig;
    private setupGlobalHandlers;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): void;
    getApp(): express.Application;
}
export default App;
//# sourceMappingURL=app.d.ts.map