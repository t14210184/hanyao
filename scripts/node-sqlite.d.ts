declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...args: unknown[]): any;
      all(...args: unknown[]): any[];
      run(...args: unknown[]): { changes?: number | bigint };
    };
  }
}
