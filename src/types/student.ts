export interface StudentInfo {
  name: string;
  class: string;
  nis: string;
}

export interface StudentRecord {
  id: number;
  nis: string;
  name: string;
  class: string;
  is_active: boolean;
  created_at: string | null;
}

export interface RegisterStudentResult {
  success: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
}
