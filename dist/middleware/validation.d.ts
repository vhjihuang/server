import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            validatedBody?: any;
        }
    }
}
export declare const generateRequestId: (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateGenerateRequest: (req: Request, _res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map