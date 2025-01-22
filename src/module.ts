import {
  Result,
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from './type'
import { AnnotationRecord, GolangCILintSummaryRecord, GotestsumSummaryRecord } from './data/type'

export interface Module {
  directory: string
  result: Result

  makeModuleTableRecord(
    owner: string,
    repo: string,
    sha: string
  ): ModuleTableRecord
  makeFailedTestTableRecords(
    owner: string,
    repo: string,
    sha: string
  ): FailedTestTableRecord[]
  makeFailedLintTableRecords(
    owner: string,
    repo: string,
    sha: string
  ): FailedLintTableRecord[]
  makeAnnotationMessages(): string[]
}

export class GoModule implements Module {
  constructor(
    private readonly _directory: string,
    private readonly _testRecord?: GotestsumSummaryRecord,
    private readonly _lintRecord?: GolangCILintSummaryRecord,
    private readonly _testFailures?: FailedTestTableRecord[],
    private readonly _lintFailures?: FailedLintTableRecord[],
    private readonly _testAnnotations?: AnnotationRecord[],
    private readonly _lintAnnotations?: AnnotationRecord[]
  ) {}

  get directory(): string {
    return this._directory
  }

  get result(): Result {
    return this._testRecord?.result === Result.Failed ||
      this._lintRecord?.result === Result.Failed
      ? Result.Failed
      : Result.Passed
  }

  makeModuleTableRecord(): ModuleTableRecord {
    return {
      name: this._testRecord?.path ?? this._lintRecord?.path ?? '-',
      version: this._testRecord?.version ?? '-',
      testResult: this._testRecord?.result ?? '-',
      testPassed: this._testRecord?.passed.toString() ?? '-',
      testFailed: this._testRecord?.failed.toString() ?? '-',
      testElapsed: this._testRecord?.time ?? '-',
      lintResult: this._lintRecord?.result ?? '-'
    }
  }

  makeFailedTestTableRecords(): FailedTestTableRecord[] {
    return this._testFailures ?? []
  }

  makeFailedLintTableRecords(): FailedLintTableRecord[] {
    return this._lintFailures ?? []
  }

  makeAnnotationMessages(): string[] {
    return [
      ...(this._testAnnotations ?? []),
      ...(this._lintAnnotations ?? [])
    ].map((annotation) => annotation.body)
  }
}
