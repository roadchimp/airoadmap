import { apiRequest } from "./client/queryClient";
import { Department } from "@shared/schema";

export async function getDepartments(): Promise<Department[]> {
  const response = await apiRequest("GET", "/api/departments");
  return response.json();
} 