import * as path from 'path'

import { Reporter, Result } from './junit/reporter'
import {
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from './type'

export interface Module {
  directory: string
  hasTestReport: boolean
  hasLintReport: boolean
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
    private readonly _testReport?: Reporter,
    private readonly _lintReport?: Reporter
  ) {}

  get directory(): string {
    return this._directory
  }

  get hasLintReport(): boolean {
    return this._lintReport !== undefined
  }

  get hasTestReport(): boolean {
    return this._testReport !== undefined
  }

  get result(): Result {
    return this._testReport?.result === Result.Failed ||
      this._lintReport?.result === Result.Failed
      ? Result.Failed
      : Result.Passed
  }

  makeModuleTableRecord(
    owner: string,
    repo: string,
    sha: string
  ): ModuleTableRecord {
    return {
      name: `[${this._directory}](https://github.com/${owner}/${repo}/blob/${sha}/${this._directory})`,
      version: this._testReport?.version ?? '-',
      testResult:
        this._testReport === undefined
          ? '-'
          : this._testReport.result === Result.Failed
            ? '❌Failed'
            : '✅Passed',
      testPassed: this._testReport?.passed.toString() ?? '-',
      testFailed: this._testReport?.failed.toString() ?? '-',
      testElapsed: this._testReport?.time?.toFixed(1).concat('s') ?? '-',
      lintResult:
        this._lintReport === undefined
          ? '-'
          : this._lintReport.result === Result.Failed
            ? '❌Failed'
            : '✅Passed'
    }
  }

  makeFailedTestTableRecords(
    owner: string,
    repo: string,
    sha: string
  ): FailedTestTableRecord[] {
    return (
      this._testReport?.failures.map(failure => {
        const { subDir, file, line, test, message } = failure
        const fullPath = path.join(this._directory, subDir, file)
        const fileTitle = `${fullPath}:${line}`
        const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${line}`
        const fileColumn = `[${fileTitle}](${fileLink})`
        const joinedMessage = message.replace(/\n/g, ' ')
        return { file: fileColumn, test, message: joinedMessage }
      }) ?? []
    )
  }

  makeFailedLintTableRecords(
    owner: string,
    repo: string,
    sha: string
  ): FailedLintTableRecord[] {
    return (
      this._lintReport?.failures.map(failure => {
        const { subDir, file, line, test, message } = failure
        const fullPath = path.join(this._directory, subDir, file)
        const fileTitle = `${fullPath}:${line}`
        const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${line}`
        const fileColumn = `[${fileTitle}](${fileLink})`
        const joinedMessage = message.replace(/\n/g, ' ')
        return { file: fileColumn, test, message: joinedMessage }
      }) ?? []
    )
  }

  makeAnnotationMessages(): string[] {
    const merged = (this._testReport?.failures ?? []).concat(
      this._lintReport?.failures ?? []
    )
    return merged.map(failure => {
      const { subDir, file, line, message } = failure
      const fullPath = path.join(this._directory, subDir, file)
      return `::error file=${fullPath},line=${line}::${message}`
    })
  }
}
