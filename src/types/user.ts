export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  description: string;
}

export type UserFormData = Omit<User, 'id'>;
