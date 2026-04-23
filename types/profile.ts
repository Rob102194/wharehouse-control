import type { Role } from "@/types/domain";

export type Profile = {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  active: boolean;
};
