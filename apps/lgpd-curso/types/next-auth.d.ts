import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      papel?: string | null;
      companyId?: string | null;
      company?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    papel?: string | null;
    companyId?: string | null;
    company?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    papel?: string | null;
    companyId?: string | null;
    company?: any;
  }
}
