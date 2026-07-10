import type { Role } from './roles';

export interface RoleWeights {
  role: Role;
  weights: Record<string, number>;
}

export interface WeightConfig {
  practice_head: RoleWeights;
  partner: RoleWeights;
  associate: RoleWeights;
}