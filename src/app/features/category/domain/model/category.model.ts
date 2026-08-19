export interface Category {
  id: number;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  title: string;
  description: string;
  active: boolean;
}
