export interface ClassAccountInfo {
  username: string;
  createdAt: Date | null;
}

export interface ClassListEntry {
  class: string;
  student_count: number;
  account: ClassAccountInfo | null;
}

export interface AdminActionResult {
  success: boolean;
  message: string;
  statusCode: number;
  class?: string;
  username?: string;
  default_password?: string;
}
