import type { Role, PracticePillar, PracticeArea, MetricArea, RAGStatus } from './roles';
import type { MetricValue, CausalAlert } from './metrics';

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: Role;
  designation?: string;
  pillar: PracticePillar;
  subPractice: PracticeArea;
  office: string;
  tenureYears: number;
  supervisorId?: string;
  lcmsUserId?: number;
  isSubHead?: boolean;
  subHeadFor?: string;
}

export interface PersonScore {
  personId: string;
  period: string;
  lpi: number;
  rag: RAGStatus;
  areaScores: Record<MetricArea, number>;
  areaScoresPriorYear: Record<MetricArea, number>;
  metricValues: MetricValue[];
  alerts: CausalAlert[];
  pillarRank: number;
  pillarTotal: number;
  firmRank: number;
  firmTotal: number;
}