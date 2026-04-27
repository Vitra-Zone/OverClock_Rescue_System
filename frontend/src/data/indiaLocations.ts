import { getAllStates, getDistricts } from 'india-state-district';

export interface IndiaStateOption {
  code: string;
  name: string;
}

const states = getAllStates() as Array<{ code: string; name: string }>;

export const INDIA_STATES: IndiaStateOption[] = states.map((state) => ({ code: state.code, name: state.name }));

function resolveStateCode(stateValue: string): string {
  const normalized = stateValue.trim().toLowerCase();
  const match = INDIA_STATES.find(
    (state) => state.code.toLowerCase() === normalized || state.name.trim().toLowerCase() === normalized,
  );
  return match?.code ?? '';
}

export function getIndiaDistricts(stateValue: string): string[] {
  if (!stateValue) return [];
  const stateCode = resolveStateCode(stateValue);
  if (!stateCode) return [];
  return getDistricts(stateCode);
}
