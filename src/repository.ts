import { Module } from './module'
import { TestResult } from './junit/type'
import { AnyRecord, FailedTestTableRecord, ModuleTableRecord } from './type'

export type MarkdownContext = {
  owner: string
  repo: string
  sha: string
  pullNumber: number
  runId: number
  actor: string
}

export class Repository {
  constructor(private readonly _modules: Module[]) {}

  static async fromDirectories(
    directories: string[],
    testReportXml: string,
    lintReportXml?: string,
  ): Promise<Repository> {
    const modules = await Promise.all(
      directories.map(
        async directory => await Module.fromXml(directory, testReportXml, lintReportXml)
      )
    )
    return new Repository(modules)
  }

  private renderTable<T extends AnyRecord>(
    header: T,
    separator: T,
    records: T[]
  ): string {
    if (records.length === 0) {
      return ''
    }

    return [
      `| ${Object.values(header).join(' | ')} |`,
      `| ${Object.values(separator).join(' | ')} |`,
      ...records.map(r => `| ${Object.values(r).join(' | ')} |`)
    ].join('\n')
  }

  makeMarkdownReport(context: MarkdownContext, limitFailures: number): string {
    const { owner, repo, sha, pullNumber, runId, actor } = context
    const commitUrl = `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

    const result = this._modules.every(m => m.result === TestResult.Passed)
      ? '`Passed`🙆‍♀️'
      : '`Failed`🙅‍♂️'

    const moduleTable = this.renderTable<ModuleTableRecord>(
      {
        name: 'Module',
        version: 'Version',
        result: 'Result',
        passed: 'Passed',
        failed: 'Failed',
        skipped: 'Skipped',
        time: 'Time'
      },
      {
        name: ':-----',
        version: '------:',
        result: ':-----',
        passed: '-----:',
        failed: '-----:',
        skipped: '------:',
        time: '---:'
      },
      this._modules.map(module =>
        module.makeModuleTableRecord(context.owner, context.repo, context.sha)
      )
    )

    const failuresRaw = this._modules
      .map(m => m.makeFailedTestTableRecords(owner, repo, sha))
      .flat()
    const failures = failuresRaw.slice(0, limitFailures)
    if (failuresRaw.length > limitFailures) {
      failures.push({
        file: `:warning: and ${failuresRaw.length - limitFailures} more...`,
        test: '-',
        message: '-'
      })
    }
    const failedTestTable = this.renderTable<FailedTestTableRecord>(
      { file: 'File', test: 'Test', message: 'Message' },
      { file: ':---', test: ':---', message: ':------' },
      failures
    )

    return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: ${result}

${moduleTable === '' ? 'No test results found.' : moduleTable}
${
  moduleTable === '' || failedTestTable === ''
    ? ''
    : `
<br/>

<details open>
<summary> Failed Tests </summary>

${failedTestTable}

</details>
`
}
---
*This comment is created for the commit [${sha.slice(0, 7)}](${commitUrl}) pushed by @${actor}.*
`.slice(1, -1)
  }

  makeAnnotationMessages(): string[] {
    return this._modules.map(m => m.makeAnnotationMessages()).flat()
  }
}
