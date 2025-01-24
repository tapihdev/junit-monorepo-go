import { GolangCILintReport, GotestsumReport, ReporterType } from './junit/type'
import { JUnitReporterFactory } from './junit/factory'

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
