const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface SuggestRequest {
  data_path: string;
}

export interface SuggestRow {
  column_name: string;
  category: string;
  description: string;
  code: string;
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

export const suggestChecks = async (dataPath: string): Promise<SuggestResponse> => {
  const response = await fetch(`${API_BASE_URL}/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data_path: dataPath }),
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
