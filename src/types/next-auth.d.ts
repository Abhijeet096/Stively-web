import { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
  }
}

// JWT session strategy (see src/lib/auth.ts) - the `jwt` callback stores
// these claims on the token itself, since there's no Session table to read
// them back from on every request. Augmenting "@auth/core/jwt" directly
// (not "next-auth/jwt", which only re-exports it via `export *` - a plain
// re-export doesn't let a `declare module` augmentation on the re-exporting
// path merge into the interface actually declared in the source module).
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
