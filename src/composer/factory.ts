import { Result } from '../type';
import { TableComposerImpl } from './table';
import { AnnotationComposer } from './annotation';
import { ResultComposer } from './result';
import { ReporterType, GitHubContext } from '../type';
import { JUnitReporterFactory } from '../junit/factory';
import { GolangCILintSummaryReport, GotestsumSummaryReport } from '../report/type';
import { UntypedTable } from '../table/untyped';

type XmlFileGroup = {
  type: ReporterType,
  directories: string[],
  fileName: string,
}

type TableSet = {
  result: Result,
  summary: UntypedTable,
  failures: UntypedTable,
  annotations: string[]
}

export class TableSetFactory {
  private _tableComposer: TableComposerImpl = new TableComposerImpl();
  private _annotationComposer: AnnotationComposer = new AnnotationComposer();
  private _resultComposer: ResultComposer = new ResultComposer();

  constructor(
    private _factory: JUnitReporterFactory,
  ) {}

  async single(
    context: GitHubContext,
    xmlFileGroup: XmlFileGroup,
  ): Promise<TableSet> {
    const reports = await Promise.all(
      xmlFileGroup.directories.map(
        async (d) => (await this._factory.fromXml(
          context,
          xmlFileGroup.type,
          d,
          xmlFileGroup.fileName
        ))
      )
    )

    const summaries = reports.map(r => r.summary)
    const failures = reports.map(r => r.failures).flat()
    const summaryTable = xmlFileGroup.type === ReporterType.GolangCILint ? this._tableComposer.toGolangCILintTable(summaries as GolangCILintSummaryReport[]) : this._tableComposer.toGotestsumTable(summaries as GotestsumSummaryReport[])

    return {
      result: this._resultComposer.toResult(reports.map(r => r.result)),
      summary: summaryTable.toUntyped(),
      failures: this._tableComposer.toFailuresTable(failures).toUntyped(),
      annotations: this._annotationComposer.toArray(failures)
    }
  }

  async multi(
    context: GitHubContext,
    xmlFileGroups: XmlFileGroup[],
  ): Promise<TableSet | undefined> {
    if (xmlFileGroups.length === 0) {
      return undefined
    }
    const reportsSets = await Promise.all(
      xmlFileGroups.map(
        async (xmlPathSet) => (await this.single(
          context,
          xmlPathSet,
        ))
      )
    )

    const main = reportsSets[0]
    const others = reportsSets.slice(1)

    return {
      result: this._resultComposer.toResult(reportsSets.map(r => r.result)),
      summary: main.summary.join(others.map(r => r.summary)),
      failures: main.failures.join(others.map(r => r.failures)),
      annotations: reportsSets.flatMap(r => r.annotations)
    }
  }
}