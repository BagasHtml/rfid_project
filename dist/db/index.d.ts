import * as schema from './schema.js';
export declare const db: import("drizzle-orm/mysql2").MySql2Database<typeof schema> & {
    $client: import("mysql2/promise").Pool;
};
