export type StepAccessLevel = 'write' | 'read' | 'none';

/**
 * Resolve a user's access level for a specific workflow step.
 *
 * allowed_steps format: null = unrestricted (all write),
 *   or a dict { [stepLabel]: "write" | "read" }. Absent key = "none" (hidden).
 */
export function getStepAccess(user: any, stepLabel: string): StepAccessLevel {
  const allowedSteps = user?.permissions?.allowed_steps;
  if (!allowedSteps) return 'write'; // null = fully unrestricted
  return (allowedSteps[stepLabel] as StepAccessLevel) ?? 'none';
}

/**
 * Cycle: none → read → write → none
 */
export function cycleAccess(current: StepAccessLevel): StepAccessLevel {
  if (current === 'none') return 'read';
  if (current === 'read') return 'write';
  return 'none';
}

/**
 * Build the new allowed_steps dict after toggling one step.
 * Returns null if all steps end up as "write" (reset to unrestricted).
 */
export function buildAllowedSteps(
  role: any,
  clickedStep: string,
  allSteps: string[]
): Record<string, string> | null {
  // Expand null to a full dict of all "write" first
  const effective: Record<string, string> = role.allowed_steps
    ? { ...role.allowed_steps }
    : Object.fromEntries(allSteps.map((s) => [s, 'write']));

  const current = (effective[clickedStep] as StepAccessLevel) ?? 'none';
  const next = cycleAccess(current);

  if (next === 'none') {
    delete effective[clickedStep];
  } else {
    effective[clickedStep] = next;
  }

  // If every step is now "write", collapse back to null (unrestricted)
  const allWrite = allSteps.every((s) => effective[s] === 'write');
  return allWrite ? null : effective;
}
