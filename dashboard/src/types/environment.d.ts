export interface Environment {
  id: string;
  userId: string;
  name: string;
  url: string;
  environment: 'development' | 'staging' | 'production';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}