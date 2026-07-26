export interface CheckFinding {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface CheckResult {
  score: number; // 0-100
  findings: CheckFinding[];
}

export function scoreFromFindings(findings: CheckFinding[]): CheckResult {
  if (findings.length === 0) return { score: 0, findings };
  const passed = findings.filter((f) => f.passed).length;
  return { score: Math.round((passed / findings.length) * 100), findings };
}
