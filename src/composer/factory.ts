import { TableComposerImpl } from './table';
import { AnnotationComposerImpl } from './annotation';
import { ReporterType, GitHubContext } from '../type';
import { SingleJUnitReporterFactory } from '../junit/factory';
import { GolangCILintSummaryReport, GotestsumSummaryReport, GolangCILintSummaryRecord, GotestsumSummaryRecord, FailureRecord } from '../report/type';
import { UntypedTable } from '../table/untyped';

type XmlFileGroup = {
  type: ReporterType,
  directories: string[],
  fileName: string,
}

type TableSet = {
  summary: UntypedTable,
  failures: UntypedTable,
  annotations: string[]
}

export class SingleTableSetFactory {
  private _tableComposer: TableComposerImpl = new TableComposerImpl();
  private _annotationComposer: AnnotationComposerImpl = new AnnotationComposerImpl();

  constructor(
    private _factory: SingleJUnitReporterFactory,
  ) {}

  async fromXml(
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
      summary: summaryTable.toUntyped(),
      failures: this._tableComposer.toFailuresTable(failures).toUntyped(),
      annotations: this._annotationComposer.toArray(failures)
    }
  }
}

export class MultiTableSetsFactory {
  constructor(
    private _factory: SingleTableSetFactory,
  ) {}

  async fromXml(
    context: GitHubContext,
    xmlFileGroups: XmlFileGroup[],
  ): Promise<TableSet | undefined> {
    if (xmlFileGroups.length === 0) {
      return undefined
    }
    const reportsSets = await Promise.all(
      xmlFileGroups.map(
        async (xmlPathSet) => (await this._factory.fromXml(
          context,
          xmlPathSet,
        ))
      )
    )

    const main = reportsSets[0]
    const others = reportsSets.slice(1)

    return {
      summary: main.summary.join(others.map(r => r.summary)),
      failures: main.failures.join(others.map(r => r.failures)),
      annotations: reportsSets.flatMap(r => r.annotations)
    }
  }
}
