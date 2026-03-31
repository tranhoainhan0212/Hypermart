import { api } from "./api";

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isBanned: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * List users with filtering and search
 */
export async function listUsers(
  page: number = 1,
  limit: number = 20,
  search: string = "",
  role?: "user" | "admin"
): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (search) params.append("search", search);
  if (role) params.append("role", role);

  const response = await api.get(`/api/admin/users?${params.toString()}`);
  return response.data;
}

/**
 * Ban a user
 */
export async function banUser(userId: string, reason?: string): Promise<AdminUser> {
  const response = await api.put(`/api/admin/users/${userId}/ban`, { reason });
  return response.data.item;
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<AdminUser> {
  const response = await api.put(`/api/admin/users/${userId}/unban`);
  return response.data.item;
}

/**
 * Change user role
 */
export async function changeUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<AdminUser> {
  const response = await api.put(`/api/admin/users/${userId}/role`, { role });
  return response.data.item;
}

/**
 * Delete a user account
 */
export async function deleteUser(userId: string): Promise<{ ok: boolean }> {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data;
}
