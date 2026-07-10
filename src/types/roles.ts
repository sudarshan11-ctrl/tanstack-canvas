export type Role = 'practice_head' | 'partner' | 'associate';

export type PracticeArea =
  | 'Corporate Law'
  | 'Competition & Antitrust'
  | 'Data Protection & TMT'
  | 'Employment Law'
  | 'ESG'
  | 'General Corporate'
  | 'Global Capability Centers'
  | 'Mergers & Acquisitions'
  | 'Private Equity & VC'
  | 'Real Estate'
  | 'Regulatory'
  | 'Direct Tax'
  | 'International Tax'
  | 'Transfer Pricing'
  | 'Disputes & Investigations'
  | 'Arbitration'
  | 'Commercial Litigation'
  | 'Economic Offences'
  | 'Insolvency'
  | 'Indirect Tax & GST'
  | 'GST & Indirect Tax Litigation'
  | 'GST Consultancy'
  | 'Tax Compliance Review'
  | 'Intellectual Property'
  | 'Artificial Intelligence'
  | 'IP Litigation'
  | 'Patents'
  | 'Plant Variety Protection'
  | 'Technology Litigation'
  | 'Trademarks'
  | 'International Trade & Customs'
  | 'BIS'
  | 'Customs'
  | 'International Trade and WTO';

export type PracticePillar =
  | 'Corporate Law'
  | 'Direct Tax'
  | 'Disputes & Investigations'
  | 'Indirect Tax & GST'
  | 'Intellectual Property'
  | 'International Trade & Customs';

export type MetricArea =
  | 'financial_health'
  | 'client_matter'
  | 'people_ops'
  | 'growth_pipeline'
  | 'brand_discoverability';

export type RAGStatus = 'green' | 'amber' | 'red' | 'na';

export type MetricCategory = 'primary' | 'secondary' | 'na';

export type DataTier = 'derivable' | 'external' | 'exported' | 'proxy' | 'pending';