export interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  description: string;
}

export type UserFormData = Omit<User, 'id'>;
