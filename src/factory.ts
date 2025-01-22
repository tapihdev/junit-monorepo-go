import {
  GolangCILintSummary,
  GotestsumSummary,
  ReporterType
} from './junit/type'
import { JUnitReporterFactory } from './junit/factory'
import { GoModule } from './module'
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
