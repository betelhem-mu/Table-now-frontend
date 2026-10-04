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

export interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  provider: string | ServiceProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  customer: string | User;
  service: string | Service;
  provider: string | User | ServiceProvider;
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}