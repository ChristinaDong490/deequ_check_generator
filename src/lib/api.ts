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
}

export interface GenerateRequest {
  rows: SuggestRow[];
  level: string;
  check_name: string;
}

export interface GenerateResponse {
  code: string;
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
