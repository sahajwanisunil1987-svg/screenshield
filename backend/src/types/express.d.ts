import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        userId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};
