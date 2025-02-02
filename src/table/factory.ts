import { Result } from '../common/type'
import { ReporterType, GitHubContext } from '../common/type'
import { JUnitReporterFactory } from '../parse/factory'
import {
  FailureRecord,
  AnyReportable,
  ReportableGolangCILintSummary,
  ReportableGotestsumSummary
} from '../report/type'
import { UntypedTable } from './base/untyped'
import { GolangCILintTable } from './golangcilint'
import { GotestsumTable } from './gotestsum'
import { FailureTable } from './failure'
import { toResult } from './result'
import { toAnnotations } from './annotation'
import { Table } from './base/typed'

export type XmlFileGroup = {
  title: string
  type: ReporterType
  directories: string[]
  fileName: string
}

type TableSet = {
  result: Result
  summary: UntypedTable
  failures: Table<FailureRecord>
  annotations: string[]
}

export class TableSetFactory {
  constructor(private _factory: JUnitReporterFactory) {}

  async single(
    context: GitHubContext,
    xmlFileGroup: XmlFileGroup
  ): Promise<TableSet> {
    const reporters = await Promise.all(
      xmlFileGroup.directories.map(
        async d =>
          await this._factory.fromXml(
            context,
            xmlFileGroup.type,
            d,
            xmlFileGroup.fileName
          )
      )
    )

    const failures = reporters.map(r => r.failures).flat()
    return {
      result: toResult(reporters.map(r => r.result)),
      summary: this.createSummaryTable(
        xmlFileGroup.type,
        xmlFileGroup.title,
        reporters.map(r => r.summary)
      ),
      failures: new FailureTable(failures).toTable(),
      annotations: toAnnotations(failures)
    }
  }

  private createSummaryTable(
    type: ReporterType,
    title: string,
    summaries: AnyReportable[]
  ): UntypedTable {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const assertNever = (_: never): never => {
      throw new Error('exhaustiveness check')
    }

    switch (type) {
      case ReporterType.GolangCILint:
        return new GolangCILintTable(
          title,
          summaries as ReportableGolangCILintSummary[]
        )
          .toTable()
          .toUntyped()
      case ReporterType.Gotestsum:
        return new GotestsumTable(
          title,
          summaries as ReportableGotestsumSummary[]
        )
          .toTable()
          .toUntyped()
      default:
        assertNever(type)
        throw new Error('unreachable')
    }
  }

  async multi(
    context: GitHubContext,
    xmlFileGroups: XmlFileGroup[]
  ): Promise<TableSet | undefined> {
    if (xmlFileGroups.length === 0) {
      return undefined
    }
    const reportsSets = await Promise.all(
      xmlFileGroups.map(
        async xmlPathSet => await this.single(context, xmlPathSet)
      )
    )

    const main = reportsSets[0]
    const others = reportsSets.slice(1)

    return {
      result: toResult(reportsSets.map(r => r.result)),
      summary: main.summary.join(others.map(r => r.summary)),
      failures: main.failures.concat(others.map(r => r.failures)),
      annotations: reportsSets.flatMap(r => r.annotations)
    }
  }
}
