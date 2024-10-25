import * as core from '@actions/core'
import * as path from 'path'

import { GotestsumReport } from './junit/reporter/gotestsum'
import { GolangCILintReport } from './junit/reporter/golangcilint'
import { JUnitReport, TestResult } from './junit/type'
import {
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from './type'

export class Module {
  constructor(
    private readonly _directory: string,
    private readonly _testReport: JUnitReport,
    private readonly _lintReport?: JUnitReport
  ) {}

  static async fromXml(
    directory: string,
    testPath: string,
    lintPath?: string
  ): Promise<Module> {
    const fromXmlIgnoreingError = async (path: string) => {
      try {
        return await GolangCILintReport.fromXml(path)
      } catch {
        core.warning(`failed to read ${path}`)
        return undefined
      }
    }
    const [test, lint] = await Promise.all([
      GotestsumReport.fromXml(path.join(directory, testPath)),
      lintPath
        ? fromXmlIgnoreingError(path.join(directory, lintPath))
        : undefined
    ])
    return new Module(directory, test, lint)
  }

  get hasLintReport(): boolean {
    return this._lintReport !== undefined
  }

  get directory(): string {
    return this._directory
  }

  get result(): TestResult {
    return this._testReport.result === TestResult.Failed ||
      this._lintReport?.result === TestResult.Failed
      ? TestResult.Failed
      : TestResult.Passed
  }

  makeModuleTableRecord(
    owner: string,
    repo: string,
    sha: string
  ): ModuleTableRecord {
    return {
      name: `[${this._directory}](https://github.com/${owner}/${repo}/blob/${sha}/${this._directory})`,
      version: this._testReport.version ?? '-',
      testResult:
        this._testReport.result === TestResult.Failed ? '❌Failed' : '✅Passed',
      testPassed: this._testReport.passed.toString(),
      testFailed: this._testReport.failed.toString(),
      testElapsed: this._testReport.time?.toFixed(1).concat('s') ?? '-',
      lintResult:
        this._lintReport === undefined
          ? '-'
          : this._lintReport.result === TestResult.Failed
            ? '❌Failed'
            : '✅Passed'
    }
  }

  makeFailedTestTableRecords(
    owner: string,
    repo: string,
    sha: string
  ): FailedTestTableRecord[] {
    return this._testReport.failures.map(failure => {
      const { subDir, file, line, test, message } = failure
      const fullPath = path.join(this._directory, subDir, file)
      const fileTitle = `${fullPath}:${line}`
      const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${line}`
      const fileColumn = `[${fileTitle}](${fileLink})`
      const joinedMessage = message.replace(/\n/g, ' ')
      return { file: fileColumn, test, message: joinedMessage }
    })
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
    return this._testReport.failures.map(failure => {
      const { subDir, file, line, message } = failure
      const fullPath = path.join(this._directory, subDir, file)
      return `::error file=${fullPath},line=${line}::${message}`
    })
  }
}
