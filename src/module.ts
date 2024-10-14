import * as path from "path";
import { GotestsumReport } from "./junit/reporter/gotestsum";
import { JUnitReport, TestResult } from "./junit/type";

export class Module {
  constructor(
    private readonly _directory: string,
    private readonly _testReport: JUnitReport
  ) {}

  static async fromXml(
    directory: string,
    testPath: string,
  ): Promise<Module> {
    return new Module(directory, await GotestsumReport.fromXml(path.join(directory, testPath)))
  }

  public get directory(): string {
    return this._directory
  }

  public makeModuleTableRecord(
    owner: string,
    repo: string,
    sha: string,
  ): string {
    const link = `[${this._directory}](https://github.com/${owner}/${repo}/blob/${sha}/${this._directory})`
    const version = this._testReport.version ?? '-'
    const result = this._testReport.result === TestResult.Failed ? '❌Failed' : '✅Passed'
    const passed = this._testReport.passed
    const failed = this._testReport.failed
    const skipped = this._testReport.skipped
    const time = this._testReport.time?.toFixed(1).concat('s') ?? '-'
    return `| ${link} | ${version} | ${result} | ${passed} | ${failed} | ${skipped} | ${time} |`
  }

  public makeFailedTestTableRecords(
    owner: string,
    repo: string,
    sha: string,
  ): string {
    return this._testReport.failures.map(failure => {
      const { fullPath, line, test, message } = failure
      const fileTitle = `${fullPath}:${line}`
      const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${line}`
      const fileColumn = `[${fileTitle}](${fileLink})`
      const joinedMessage = message.replace(/\n/g, ' ')
      return `| ${fileColumn} | ${test} | ${joinedMessage} |`
    }).join('\n')
  }

  public makeFailedLintTableRecords(): string {
    return ''
  }

  public makeAnnotationMessages(): string[] {
    return this._testReport.failures.map(failure => {
      const { subDir, file, line, message } = failure
      const fullPath = path.join(this._directory, subDir, file)
      return `::error file=${fullPath},line=${line}::${message}`
    })
  }
}