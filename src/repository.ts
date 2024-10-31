import { Module, ModuleFactory } from './module'
import { Result } from './junit/reporter'
import {
  AnyRecord,
  FailedTestTableRecord,
  FailedLintTableRecord,
  ModuleTableRecord
} from './type'

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
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<Repository> {
    const map = new Map<string, [boolean, boolean]>()
    testDirectories.forEach(d => map.set(d, [true, false]))
    lintDirectories.forEach(d => {
      if (map.has(d)) {
        map.set(d, [true, true])
      } else {
        map.set(d, [false, true])
      }
    })
    const modules = await Promise.all(
      Array.from(map.entries()).map(async ([directory, [test, lint]]) => {
        const testPath = test ? testReportXml : undefined
        const lintPath = lint ? lintReportXml : undefined
        return ModuleFactory.fromXml(directory, testPath, lintPath)
      })
    )
    return new Repository(modules)
  }

  get numModules(): number {
    return this._modules.length
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

  makeMarkdownReport(
    context: MarkdownContext,
    failedTestLimit: number,
    failedLintLimit = 10
  ): string {
    const { owner, repo, sha, pullNumber, runId, actor } = context
    const commitUrl = `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

    const result = this._modules.every(m => m.result === Result.Passed)
      ? '`Passed`🙆‍♀️'
      : '`Failed`🙅‍♂️'

    const moduleTable = this.renderTable<ModuleTableRecord>(
      {
        name: 'Module',
        version: 'Version',
        testResult: 'Test',
        testPassed: 'Passed',
        testFailed: 'Failed',
        testElapsed: 'Time',
        lintResult: 'Lint'
      },
      {
        name: ':-----',
        version: '------:',
        testResult: ':---',
        testPassed: '-----:',
        testFailed: '-----:',
        testElapsed: '---:',
        lintResult: ':---'
      },
      this._modules.map(module =>
        module.makeModuleTableRecord(context.owner, context.repo, context.sha)
      )
    )

    const failedTests = this._modules
      .map(m => m.makeFailedTestTableRecords(owner, repo, sha))
      .flat()
    const faileTestsLimited = failedTests.slice(0, failedTestLimit)
    if (failedTests.length > failedTestLimit) {
      faileTestsLimited.push({
        file: `:warning: and ${failedTests.length - failedTestLimit} more...`,
        test: '-',
        message: '-'
      })
    }
    const failedTestTable = this.renderTable<FailedTestTableRecord>(
      { file: 'File', test: 'Test', message: 'Message' },
      { file: ':---', test: ':---', message: ':------' },
      faileTestsLimited
    )

    const failedLints = this._modules
      .map(m => m.makeFailedLintTableRecords(owner, repo, sha))
      .flat()
    const failedLintsLimited = failedLints.slice(0, failedLintLimit)
    if (failedLints.length > failedLintLimit) {
      failedLintsLimited.push({
        file: `:warning: and ${failedLints.length - failedLintLimit} more...`,
        test: '-',
        message: '-'
      })
    }
    const failedLintTable = this.renderTable<FailedLintTableRecord>(
      { file: 'File', test: 'Lint', message: 'Message' },
      { file: ':---', test: ':---', message: ':------' },
      failedLintsLimited
    )

    return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: ${result}

${moduleTable === '' ? 'No test results found.' : moduleTable}
${
  failedTestTable === ''
    ? ''
    : `
<br/>

<details open>
<summary> Failed Tests </summary>

${failedTestTable}

</details>
`
}${
      failedLintTable === ''
        ? ''
        : `
<br/>

<details open>
<summary> Failed Lints </summary>

${failedLintTable}

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
