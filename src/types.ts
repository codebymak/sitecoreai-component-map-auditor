/** Severity of an audit finding. */
export type Severity = 'error' | 'warning' | 'info';

/** One component registered in a Content SDK component map. */
export type MapEntry = {
  name: string;
  /** Present when the map entry sets componentType (Content SDK App Router). */
  componentType?: 'server' | 'client' | 'universal';
  source: 'server-map' | 'client-map';
};

/** A rendering instance discovered in layout JSON or a workflow fixture. */
export type UsedRendering = {
  componentName: string;
  path: string;
  fields?: string[];
};

export type FindingCode =
  | 'unknown-rendering'
  | 'missing-from-client-map'
  | 'missing-field-contract'
  | 'missing-required-field'
  | 'jss-leftover'
  | 'map-parse-empty'
  | 'builtin-missing';

export type Finding = {
  code: FindingCode;
  severity: Severity;
  message: string;
  componentName?: string;
  path?: string;
  hint?: string;
};

export type FieldContract = {
  /** Required field names for this component's datasource JSON. */
  requiredFields: string[];
};

export type AuditInput = {
  serverMap: MapEntry[];
  clientMap: MapEntry[];
  used: UsedRendering[];
  contracts: Record<string, FieldContract>;
  pitfallHits: Finding[];
};

export type AuditReport = {
  ok: boolean;
  summary: {
    mapEntries: number;
    clientMapEntries: number;
    usedRenderings: number;
    uniqueUsed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  findings: Finding[];
};
