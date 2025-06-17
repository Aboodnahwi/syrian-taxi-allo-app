
export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  governorate: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (userData: any) => Promise<boolean>;
  signIn: (phone: string) => Promise<{ success: boolean; user: User | null }>;
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; user: User | null }>;
  signOut: () => Promise<void>;
}
