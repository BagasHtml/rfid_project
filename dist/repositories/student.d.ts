export interface StudentListItem {
    id: number;
    nis: string;
    name: string;
    class: string;
}
export declare function listActive(): Promise<StudentListItem[]>;
export declare function findById(id: number): Promise<StudentListItem | null>;
