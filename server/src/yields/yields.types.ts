// yields.types.ts
export interface YieldRow {
    date: string;   // 'YYYY-MM-DD'
    wk4?: number;
    wk8?: number;
    wk13?: number;
    wk17?: number;
    wk26?: number;
    wk52?: number;
  }
  
  export interface YieldsResult {
    year: number;
    month?: number;
    rows: YieldRow[];
  }
  