import { GolangCILintReport, GotestsumReport, ReporterType } from './junit/type'
import { JUnitReporterFactory } from './junit/factory'
import { GoModule } from './module'

export class GoRepositoryFactory {
  constructor(private _parser: JUnitReporterFactory) {}

  async fromXml(
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

    const map = new Map<string, [GotestsumReport?, GolangCILintReport?]>()
    test.forEach(d => map.set(d.path, [d as GotestsumReport, undefined]))
    // NOTE: Iterate over a set to avoid maching twice the same directory in lintDirectories
    new Set(lint).forEach(d => {
      const v = map.get(d.path)
      if (v !== undefined) {
        map.set(d.path, [v[0], d as GolangCILintReport])
      } else {
        map.set(d.path, [undefined, d as GolangCILintReport])
      }
    })

    const modules = Array.from(map).map(
      ([path, [test, lint]]) => new GoModule(path, test, lint)
    )

    return modules
  }
}
