import { TableComposerImpl } from './table';
import { AnnotationComposerImpl } from './annotation';
import { ReporterType, GitHubContext } from '../type';
import { Table } from '../table/typed';
import { SingleJUnitReporterFactory } from '../junit/factory';
import { GolangCILintSummaryReport, GotestsumSummaryReport, GolangCILintSummaryRecord, GotestsumSummaryRecord, FailureRecord } from '../report/type';
import { run } from 'src/main';

type TableSet = {
  type: ReporterType,
  summary: Table<GotestsumSummaryRecord | GolangCILintSummaryRecord>,
  failures: Table<FailureRecord>,
  annotations: string[]
}

export class TableSetFactory {
  private _tableComposer: TableComposerImpl = new TableComposerImpl();
  private _annotationComposer: AnnotationComposerImpl = new AnnotationComposerImpl();

  constructor(
    private _factory: SingleJUnitReporterFactory,
  ) {
    this._tableComposer = new TableComposerImpl();
    this._annotationComposer = new AnnotationComposerImpl();
  }

  async fromXml(
    context: GitHubContext,
    type: ReporterType,
    directories: string[],
    xmlName: string,
  ): Promise<TableSet> {
    const reports = await Promise.all(
      directories.map(
        async (d) => (await this._factory.fromXml(
          context,
          type,
          d,
          xmlName
        ))
      )
    )

    const summaries = reports.map(r => r.summary)
    const failures = reports.map(r => r.failures).flat()
    const summaryTable = type === ReporterType.GolangCILint ? this._tableComposer.toGolangCILintTable(summaries as GolangCILintSummaryReport[]) : this._tableComposer.toGotestsumTable(summaries as GotestsumSummaryReport[])

    return {
      type,
      summary: summaryTable,
      failures: this._tableComposer.toFailuresTable(failures),
      annotations: this._annotationComposer.toArray(failures)
    }
  }
}
