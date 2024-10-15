import * as path from 'path'

import { GotestsumReport } from './junit/reporter/gotestsum'
import { JUnitReport, TestResult } from './junit/type'
import {
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from './type'
import { GolangCILintReport } from './junit/reporter/golangcilint'

export class Module {
  constructor(
    private readonly _directory: string,
    private readonly _testReport: JUnitReport,
    private readonly _lintReport?: JUnitReport,
  ) {}

  static async fromXml(directory: string, testPath: string, lintPath?: string): Promise<Module> {
    const [ test, lint ] = await Promise.all([
      GotestsumReport.fromXml(path.join(directory, testPath)),
      lintPath ? GolangCILintReport.fromXml(path.join(directory, lintPath)) : undefined
    ])
    return new Module(
      directory,
      test,
      lint,
    )
  }

  get directory(): string {
    return this._directory
  }

  get result(): TestResult {
    return this._testReport.result
  }

  makeModuleTableRecord(
    owner: string,
    repo: string,
    sha: string
  ): ModuleTableRecord {
    const name = `[${this._directory}](https://github.com/${owner}/${repo}/blob/${sha}/${this._directory})`
    const version = this._testReport.version ?? '-'
    const result =
      this._testReport.result === TestResult.Failed ? '❌Failed' : '✅Passed'
    const passed = this._testReport.passed.toString()
    const failed = this._testReport.failed.toString()
    const skipped = this._testReport.skipped.toString()
    const time = this._testReport.time?.toFixed(1).concat('s') ?? '-'
    return {
      name,
      version,
      result,
      passed,
      failed,
      skipped,
      time
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

  makeFailedLintTableRecords(): FailedLintTableRecord[] {
    return []
  }

  makeAnnotationMessages(): string[] {
    return this._testReport.failures.map(failure => {
      const { subDir, file, line, message } = failure
      const fullPath = path.join(this._directory, subDir, file)
      return `::error file=${fullPath},line=${line}::${message}`
    })
  }
}
