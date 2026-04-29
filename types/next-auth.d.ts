
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      companyId?: string | null;
      company?: {
        id: string;
        companyName: string;
        tradeName?: string | null;
      } | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    companyId?: string | null;
    company?: {
      id: string;
      companyName: string;
      tradeName?: string | null;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    companyId?: string | null;
    company?: {
      id: string;
      companyName: string;
      tradeName?: string | null;
    } | null;
  }
}
