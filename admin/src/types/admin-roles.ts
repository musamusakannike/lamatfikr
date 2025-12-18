export interface AdminRoleCount {
  role: string;
  count: number;
}

export interface AdminRolesSummaryResponse {
  roles: AdminRoleCount[];
  generatedAt: string;
}
