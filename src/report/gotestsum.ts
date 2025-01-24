import { Result } from '../type'
import { Index, GotestsumReport, GotestsumSummaryRecord } from './type'

export class GotestsumReportImpl implements GotestsumReport {
  constructor(
    readonly moduleDir: string,
    readonly result: Result,
    readonly passed: number,
    readonly failed: number,
    readonly version?: string,
    readonly time?: number,
  ) {}

  toIndex(): Index {
    return this.moduleDir
  }

  toRecord(): GotestsumSummaryRecord {
    return {
      version: this.version ?? '-',
      result: this.result === Result.Failed ? '❌Failed' : '✅Passed',
      passed: this.passed.toString(),
      failed: this.failed.toString(),
      time: this.time?.toFixed(1).concat('s') ?? '-'
    }
  }
}