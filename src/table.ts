import fs from 'fs'

import { Result, AnyRecord, ModuleTableRecord } from './type'

import { GolangCILintReport, GotestsumReport, ReporterType } from './junit/type'
import { JUnitReporterFactory, JUnitReporterFactoryImpl } from './junit/factory'
import { AnnotationRecord } from './data/type'
import {
  GotestsumSummaryViewImpl,
  GolangCILintSummaryViewImpl
} from './data/summary'
import { FailureSummaryViewImpl } from './data/failure'
import { AnnotationViewImpl } from './data/annotation'

const undefinedString = '-'

export type GitHubActionsContext = {
  owner: string
  repo: string
  sha: string
  pullNumber: number | undefined
  runId: number
  actor: string
}

// NOTE: This is a temporary implementation
type Output = {
  body: string
  annotations: AnnotationRecord[]
}

export async function report(
  context: GitHubActionsContext,
  testDirs: string[],
  lintDirs: string[],
  testReportXml: string,
  lintReportXml: string,
  failedTestLimit: number,
  failedLintLimit: number
): Promise<Output> {
  const { owner, repo, sha } = context
  const repoterFactory = new JUnitReporterFactoryImpl(fs.promises.readFile)
  const factory = new GoModulesFactory(repoterFactory)
  const [test, lint] = await factory.fromXml(
    testDirs,
    lintDirs,
    testReportXml,
    lintReportXml
  )

  // result
  const result = [test, lint]
    .flat()
    .some(m => m.summary.result === Result.Failed)
    ? Result.Failed
    : Result.Passed

  // NOTE: concat(Table[], axis=0)
  const testSummaryRecords = test.map(d => {
    const summaryView = new GotestsumSummaryViewImpl(d.path, d.summary)
    return summaryView.render(owner, repo, sha)
  })
  const lintSummaryRecords = lint.map(d => {
    const summaryView = new GolangCILintSummaryViewImpl(d.path, d.summary)
    return summaryView.render(owner, repo, sha)
  })
  const summaryRecords = new Map<string, ModuleTableRecord>()
  testSummaryRecords.forEach(r =>
    summaryRecords.set(r.path, {
      name: r.path,
      version: r.version,
      testResult: r.result,
      testPassed: r.passed,
      testFailed: r.failed,
      testElapsed: r.time,
      lintResult: undefinedString
    })
  )
  lintSummaryRecords.forEach(r => {
    const v = summaryRecords.get(r.path)
    if (v !== undefined) {
      summaryRecords.set(r.path, {
        ...v,
        lintResult: r.result
      })
    } else {
      summaryRecords.set(r.path, {
        name: r.path,
        version: undefinedString,
        testResult: undefinedString,
        testPassed: undefinedString,
        testFailed: undefinedString,
        testElapsed: undefinedString,
        lintResult: r.result
      })
    }
  })

  const moduleTable = new Table(
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
    Array.from(summaryRecords.values())
  )

  // NOTE: concat(Table[], axis=1)
  const testFailures = test
    .map(d =>
      d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
    )
    .flat()
  const testFailuresLimited = testFailures.slice(0, failedTestLimit)
  if (testFailures.length > failedTestLimit) {
    testFailuresLimited.push({
      file: `:warning: and ${testFailures.length - failedTestLimit} more...`,
      test: '-',
      message: '-'
    })
  }
  const failedTestTable = new Table(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    testFailuresLimited
  )

  // NOTE: concat(Table[], axis=1)
  const lintFailures = lint
    .map(d =>
      d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
    )
    .flat()

  const lintFailuresLimited = testFailures.slice(0, failedTestLimit)
  if (testFailures.length > failedTestLimit) {
    testFailuresLimited.push({
      file: `:warning: and ${lintFailures.length - failedLintLimit} more...`,
      test: '-',
      message: '-'
    })
  }

  const failedLintTable = new Table(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    lintFailuresLimited
  )

  // annotations
  const testAnnotations = test
    .map(d =>
      d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render()
      })
    )
    .flat()
  const lintAnnotations = lint
    .map(d =>
      d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render()
      })
    )
    .flat()
  const annotations = [...testAnnotations, ...lintAnnotations]

  const body = makeMarkdownReport(
    context,
    result,
    moduleTable.render(),
    failedTestTable.render(),
    failedLintTable.render()
  )

  return {
    body,
    annotations
  }
}

export class GoModulesFactory {
  constructor(private _parser: JUnitReporterFactory) {}

  async fromXml(
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GotestsumReport[], GolangCILintReport[]]> {
    const all = await Promise.all([
      await Promise.all(
        testDirectories.map(
          async d =>
            (await this._parser.fromJSON(
              ReporterType.Gotestsum,
              d,
              testReportXml
            )) as GotestsumReport
        )
      ),
      await Promise.all(
        lintDirectories.map(
          async d =>
            (await this._parser.fromJSON(
              ReporterType.GolangCILint,
              d,
              lintReportXml
            )) as GolangCILintReport
        )
      )
    ])

    return [all[0], all[1]]
  }
}

export function makeMarkdownReport(
  context: GitHubActionsContext,
  result: Result,
  moduleTable: string,
  failedTestTable: string,
  failedLintTable: string
): string {
  const { owner, repo, sha, pullNumber, runId, actor } = context
  const commitUrl =
    pullNumber === undefined
      ? `https://github.com/${owner}/${repo}/commit/${sha}`
      : `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

  return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: ${result === Result.Passed ? '`Passed`🙆‍♀️' : '`Failed`🙅‍♂️'}

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

class Table<T extends AnyRecord> {
  constructor(
    private readonly header: T,
    private readonly separator: T,
    private readonly records: T[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return Object.keys(this.header).length
  }

  render(): string {
    if (this.rows === 0) {
      return ''
    }

    return [
      `| ${Object.values(this.header).join(' | ')} |`,
      `| ${Object.values(this.separator).join(' | ')} |`,
      ...this.records.map(r => `| ${Object.values(r).join(' | ')} |`)
    ].join('\n')
  }
}
