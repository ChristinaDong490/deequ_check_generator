const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface SuggestRequest {
  path: string;
  key_cols?: string[];
}

export interface SuggestRow {
  id: string;
  column: string;
  description: string;
  rule?: string;
  code: string;
  current_value?: string;
  include?: boolean;
}

export interface SuggestResponse {
  rows: SuggestRow[];
  row_count: number;
  schema?: Array<{ name: string; type: string }>;
}

export interface GenerateRequest {
  rows: SuggestRow[];
  level: string;
  check_name: string;
}

export interface GenerateResponse {
  code: string;
}

export interface VerifyCodeRequest {
  path: string;
  code: string;
}

export interface ConstraintResult {
  constraint: string;
  constraint_status: string;
  current_value?: string;
}

export interface VerifyCodeResponse {
  total: number;
  success: number;
  failure: number;
  per_constraint: ConstraintResult[];
  failures: Array<{
    constraint: string;
    column: string;
    message: string;
    metric: string;
    actualValue: string;
  }>;
}

export interface TranspileRequest {
  rows: SuggestRow[];
  force_all?: boolean;
  model?: string;
}

export interface TranspileResponse {
  rows: SuggestRow[];
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface SchemaRequest {
  path: string;
  fmt?: string;
}

export interface SchemaResponse {
  columns: string[];
}

export const suggestChecks = async (path: string, keyCols?: string[]): Promise<SuggestResponse> => {
  const response = await fetch(`${API_BASE_URL}/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      path,
      key_cols: keyCols || []
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
  }

  return response.json();
};

export const generateCode = async (
  rows: SuggestRow[],
  level: string = "Error",
  checkName: string = "Data Quality Checks"
): Promise<GenerateResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rows,
      level,
      check_name: checkName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate code: ${response.statusText}`);
  }

  return response.json();
};

export const verifyCode = async (
  path: string,
  code: string
): Promise<VerifyCodeResponse> => {
  const response = await fetch(`${API_BASE_URL}/verify_code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to verify code: ${response.statusText}`);
  }

  return response.json();
};

export const transpileChecks = async (
  rows: SuggestRow[],
  forceAll: boolean = false
): Promise<TranspileResponse> => {
  const response = await fetch(`${API_BASE_URL}/transpile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rows,
      force_all: forceAll,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to transpile checks: ${response.statusText}`);
  }

  return response.json();
};

export const getSchema = async (path: string, fmt: string = "parquet"): Promise<SchemaResponse> => {
  const response = await fetch(`${API_BASE_URL}/schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      fmt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.statusText}`);
  }

  return response.json();
};
