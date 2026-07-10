import type { MetricArea, MetricCategory, DataTier, RAGStatus, Role } from './roles';

export interface MetricDefinition {
  id: string;
  name: string;
  area: MetricArea;
  category: Record<Role, MetricCategory>;
  dataTier: DataTier;
  description: string;
  targetDescription: string;
}

export interface MetricValue {
  metricId: string;
  personId: string;
  period: string;
  value: number | string | null;
  unit: string;
  target: number | string | null;
  priorYear: number | string | null;
  trend: number[];
  rag: RAGStatus;
  deltaVsTarget: number | null;
  deltaVsPriorYear: number | null;
  passive?: boolean;
  remark?: string | null;
  /** FH-15 scorecard: EW and STD columns matched — standard-hours basis. */
  scorecardStar?: boolean;
}

export interface CausalAlert {
  secondaryId: string;
  secondaryName: string;
  primaryId: string;
  primaryName: string;
  mechanism: string;
  severity: 'high' | 'medium';
  description: string;
}