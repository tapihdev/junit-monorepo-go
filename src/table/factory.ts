import { Result } from '../type'
import { ReporterType, GitHubContext } from '../type'
import { JUnitReporterFactory } from '../reporter/factory'
import {
  FailureRecord,
  GolangCILintSummaryReport,
  GotestsumSummaryReport
} from '../report/type'
import { UntypedTable } from './base/untyped'
import { GolangCILintTable } from './golangcilint'
import { GotestsumTable } from './gotestsum'
import { FailureTable } from './failure'
import { toResult } from './result'
import { toAnnotations } from './annotation'
import { Table } from './base/typed'

export type XmlFileGroup = {
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

    const summaries = reporters.map(r => r.summary)
    const failures = reporters.map(r => r.failures).flat()
    const summaryTable =
      xmlFileGroup.type === ReporterType.GolangCILint
        ? new GolangCILintTable(summaries as GolangCILintSummaryReport[])
        : new GotestsumTable(summaries as GotestsumSummaryReport[])

    return {
      result: toResult(reporters.map(r => r.result)),
      summary: summaryTable.toTable().toUntyped(),
      failures: new FailureTable(failures).toTable(),
      annotations: toAnnotations(failures)
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
