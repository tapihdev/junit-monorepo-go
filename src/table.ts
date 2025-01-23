import fs from 'fs'

import {
  Result,
  AnyRecord,
  ModuleTableRecord,
  FailedCaseTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from './type'

import { GotestsumSummary, ReporterType } from './junit/type'
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
  annotations: string[]
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
  const repoterFactory = new JUnitReporterFactoryImpl(fs.promises.readFile)
  const factory = new GoModulesFactory(repoterFactory)
  const modules = await factory.fromXml(
    context.owner,
    context.repo,
    context.sha,
    testDirs,
    lintDirs,
    testReportXml,
    lintReportXml
  )

  const moduleTable = createModuleTable(
    modules.map(module => module.makeModuleTableRecord())
  )
  const failedTestTable = createFailedCaseTable(
    modules.map(m => m.makeFailedTestTableRecords()).flat(),
    failedTestLimit
  )
  const failedLintTable = createFailedCaseTable(
    modules.map(m => m.makeFailedLintTableRecords()).flat(),
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
    annotations: modules.map(m => m.makeAnnotationMessages()).flat()
  }
}

export interface Module {
  directory: string
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
    private readonly _testRecord?: GotestsumSummaryRecord,
    private readonly _lintRecord?: GolangCILintSummaryRecord,
    private readonly _testFailures?: FailedTestTableRecord[],
    private readonly _lintFailures?: FailedLintTableRecord[],
    private readonly _testAnnotations?: AnnotationRecord[],
    private readonly _lintAnnotations?: AnnotationRecord[]
  ) {}

  get directory(): string {
    return this._directory
  }

  get result(): Result {
    return this._testRecord?.result === Result.Failed ||
      this._lintRecord?.result === Result.Failed
      ? Result.Failed
      : Result.Passed
  }

  makeModuleTableRecord(): ModuleTableRecord {
    return {
      name: this._testRecord?.path ?? this._lintRecord?.path ?? '-',
      version: this._testRecord?.version ?? '-',
      testResult: this._testRecord?.result ?? '-',
      testPassed: this._testRecord?.passed.toString() ?? '-',
      testFailed: this._testRecord?.failed.toString() ?? '-',
      testElapsed: this._testRecord?.time ?? '-',
      lintResult: this._lintRecord?.result ?? '-'
    }
  }

  makeFailedTestTableRecords(): FailedTestTableRecord[] {
    return this._testFailures ?? []
  }

  makeFailedLintTableRecords(): FailedLintTableRecord[] {
    return this._lintFailures ?? []
  }

  makeAnnotationMessages(): string[] {
    return [
      ...(this._testAnnotations ?? []),
      ...(this._lintAnnotations ?? [])
    ].map(annotation => annotation.body)
  }
}

export class GoModulesFactory {
  constructor(private _parser: JUnitReporterFactory) {}

  async fromXml(
    owner: string,
    repo: string,
    sha: string,
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<GoModule[]> {
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

    // TODO: Remove this after refactoring is done
    const test = all[0]
    const lint = all[1]

    const map = new Map<
      string,
      [
        {
          summary: GotestsumSummaryRecord
          failures: FailureRecord[]
          annotations: AnnotationRecord[]
        }?,
        {
          summary: GolangCILintSummaryRecord
          failures: FailureRecord[]
          annotations: AnnotationRecord[]
        }?
      ]
    >()
    test.forEach(d => {
      const summaryView = new GotestsumSummaryViewImpl(
        d.path,
        d.summary as GotestsumSummary
      )
      const summary = summaryView.render(owner, repo, sha)
      const failures = d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
      const annotations = d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render()
      })
      return map.set(d.path, [{ summary, failures, annotations }, undefined])
    })
    // NOTE: Iterate over a set to avoid maching twice the same directory in lintDirectories
    new Set(lint).forEach(d => {
      const summaryView = new GolangCILintSummaryViewImpl(
        d.path,
        d.summary as GotestsumSummary
      )
      const summary = summaryView.render(owner, repo, sha)
      const failures = d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
      const annotations = d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render()
      })
      const lint = { summary, failures, annotations }

      const v = map.get(d.path)
      if (v !== undefined) {
        map.set(d.path, [v[0], lint])
      } else {
        map.set(d.path, [undefined, lint])
      }
    })

    const modules = Array.from(map).map(
      ([path, [test, lint]]) =>
        new GoModule(
          path,
          test?.summary,
          lint?.summary,
          test?.failures,
          lint?.failures,
          test?.annotations,
          lint?.annotations
        )
    )

    return modules
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
