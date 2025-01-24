import fs from 'fs'

import {
  Result,
  AnyRecord,
  ModuleTableRecord,
  FailedCaseTableRecord
} from './type'

import {
  GolangCILintReport,
  GolangCILintSummary,
  GotestsumSummary,
  ReporterType
} from './junit/type'
import { JUnitReporterFactory, JUnitReporterFactoryImpl } from './junit/factory'
import {
  AnnotationRecord,
  GotestsumSummaryRecord,
  GolangCILintSummaryRecord,
  FailureRecord
} from './data/type'
import {
  GotestsumSummaryViewImpl,
  GolangCILintSummaryViewImpl
} from './data/summary'
import { FailureSummaryViewImpl } from './data/failure'
import { AnnotationViewImpl } from './data/annotation'

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

  // NOTE: concat(Table[], axis=0)
  const testSummaryRecords = test.map(d => {
    const summaryView = new GotestsumSummaryViewImpl(
      d.path,
      d.summary as GotestsumSummary
    )
    return summaryView.render(owner, repo, sha)
  })
  const lintSummaryRecords = lint.map(d => {
    const summaryView = new GolangCILintSummaryViewImpl(
      d.path,
      d.summary as GolangCILintSummary
    )
    return summaryView.render(owner, repo, sha)
  })
  const summaryRecords = new Map<string, [GotestsumSummaryRecord?, GolangCILintSummaryRecord?]>()
  testSummaryRecords.forEach(r => summaryRecords.set(r.path, [r, undefined]))
  lintSummaryRecords.forEach(r => {
    const v = summaryRecords.get(r.path)
    if (v !== undefined) {
      summaryRecords.set(r.path, [v[0], r])
    } else {
      summaryRecords.set(r.path, [undefined, r])
    }
  })

  // NOTE: concat(Table[], axis=1)
  const testFailures = test.map(d => d.failures.map(f => {
      const view = new FailureSummaryViewImpl(d.path, f)
      return view.render(owner, repo, sha)
  })).flat()
  const lintFailures = lint.map(d => d.failures.map(f => {
      const view = new FailureSummaryViewImpl(d.path, f)
      return view.render(owner, repo, sha)
  })).flat()

  const testAnnotations = test.map(d => d.failures.map(f => {
      const view = new AnnotationViewImpl(d.path, f)
      return view.render()
  })).flat()
  const lintAnnotations = lint.map(d => d.failures.map(f => {
      const view = new AnnotationViewImpl(d.path, f)
      return view.render()
  })).flat()
  const annotations = [...testAnnotations, ...lintAnnotations]

  const moduleTable = createModuleTable(
    modules.map(module => module.moduleTableRecord)
  )
  const failedTestTable = createFailedCaseTable(
    modules.map(m => m.failedTestTableRecords).flat(),
    failedTestLimit
  )
  const failedLintTable = createFailedCaseTable(
    modules.map(m => m.failedLintTableRecords).flat(),
    failedLintLimit
  )
  const result = modules.every(m => m.result === Result.Passed)
    ? Result.Passed
    : Result.Failed

  const body = makeMarkdownReport(
    context,
    result,
    moduleTable,
    failedTestTable,
    failedLintTable
  )

  return {
    body,
    annotations,
  }
}

export class GoModulesFactory {
  constructor(private _parser: JUnitReporterFactory) {}

  async fromXml(
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GolangCILintReport[], GolangCILintReport[]]> {
    const all = await Promise.all([
      await Promise.all(
        testDirectories.map(async d =>
          this._parser.fromJSON(ReporterType.Gotestsum, d, testReportXml)
        )
      ),
      await Promise.all(
        lintDirectories.map(async d =>
          this._parser.fromJSON(ReporterType.GolangCILint, d, lintReportXml)
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

function renderTable<T extends AnyRecord>(
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

export function createModuleTable(modules: ModuleTableRecord[]): string {
  return renderTable(
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
    modules
  )
}

export function createFailedCaseTable(
  failed: FailedCaseTableRecord[],
  limit: number
): string {
  const failedLimited = failed.slice(0, limit)
  if (failed.length > limit) {
    failedLimited.push({
      file: `:warning: and ${failed.length - limit} more...`,
      test: '-',
      message: '-'
    })
  }
  return renderTable(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    failedLimited
  )
}
