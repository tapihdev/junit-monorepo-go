import * as path from 'path'

import { XmlParser } from './junit/xml'
import { GoRepository } from './repository'
import { GotestsumReport } from './junit/gotestsum'
import { GolangCILintReport } from './junit/golangcilint'
import { GoModule } from './module'

export class GoRepositoryFactory {
  constructor(private _parser: XmlParser) {}

  async fromXml(
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<GoRepository> {
    const all = await Promise.all([
      await Promise.all(
        testDirectories.map(
          async d =>
            new GotestsumReport(
              d,
              await this._parser(path.join(d, testReportXml))
            )
        )
      ),
      await Promise.all(
        lintDirectories.map(
          async d =>
            new GolangCILintReport(
              d,
              await this._parser(path.join(d, lintReportXml))
            )
        )
      )
    ])

    const test = all[0]
    const lint = all[1]

    const map = new Map<string, [GotestsumReport?, GolangCILintReport?]>()
    test.forEach(d => map.set(d.path, [d, undefined]))
    // NOTE: Iterate over a set to avoid maching twice the same directory in lintDirectories
    new Set(lint).forEach(d => {
      const v = map.get(d.path)
      if (v !== undefined) {
        map.set(d.path, [v[0], d])
      } else {
        map.set(d.path, [undefined, d])
      }
    })

    const modules = Array.from(map).map(
      ([path, [test, lint]]) => new GoModule(path, test, lint)
    )

    return new GoRepository(modules)
  }
}
