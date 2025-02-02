export type Index = string

// Reports
export interface Reportable<T extends AnyRecord> {
  readonly index: Index
  readonly record: T
}

interface Annotatable {
  readonly annotation: ReportableAnnotation
}

export type AnyReportable =
  | ReportableGotestsumSummary
  | ReportableGolangCILintSummary
  | ReportableFailure
  | ReportableAnnotation

export type ReportableSummary =
  | ReportableGotestsumSummary
  | ReportableGolangCILintSummary
export type ReportableGotestsumSummary = Reportable<GotestsumSummaryRecord>
export type ReportableGolangCILintSummary =
  Reportable<GolangCILintSummaryRecord>

export type ReportableFailure = Reportable<FailureRecord> & Annotatable
export type ReportableAnnotation = Reportable<AnnotationRecord>

// Records
export type AnyRecord =
  | GotestsumSummaryRecord
  | GolangCILintSummaryRecord
  | FailureRecord
  | AnnotationRecord

export type GotestsumSummaryRecord = {
  version?: string
  result: string
  passed: string
  failed: string
  time?: string
}

export type GolangCILintSummaryRecord = {
  result: string
}

export type FailureRecord = {
  type: string
  test: string
  message: string
}

export type AnnotationRecord = {
  body: string
}
