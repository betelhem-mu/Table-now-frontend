export type UserRole = "customer" | "provider";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  provider: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  customer: string | User;
  service: string | Service;
  provider: string | User;
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}