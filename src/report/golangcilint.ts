import { Result } from '../type'
import { Index, GolangCILintReport, GolangCILintSummaryRecord } from './type'

export class GolangCILintReportImpl implements GolangCILintReport {
  constructor(
    readonly rootDir: string,
    readonly result: Result,
  ) {}

  toIndex(): Index {
    return this.rootDir
  }

  toRecord(): GolangCILintSummaryRecord {
    return {
      result: this.result === Result.Failed ? '❌Failed' : '✅Passed'
    }
  }
}
