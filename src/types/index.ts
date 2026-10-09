export type UserRole = "customer" | "provider" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  providerStatus?: "pending" | "approved" | "rejected";
  isSuspended?: boolean;
  rejectionReason?: string;
  createdAt?: string;
}

export interface ProviderApplication {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  providerStatus: "pending" | "approved" | "rejected";
  isSuspended: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminDashboardStats {
  totalCustomers: number;
  totalApprovedProviders: number;
  pendingProviderApplications: number;
  totalServices: number;
  totalBookings: number;
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
  category?: string;
  image?: string;
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
  time?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}