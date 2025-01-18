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
    const modules = await Promise.all(
      [
        await Promise.all(testDirectories.map(async d => new GotestsumReport(d, await this._parser(path.join(d, testReportXml))))),
        await Promise.all(lintDirectories.map(async d => new GolangCILintReport(d, await this._parser(path.join(d, lintReportXml))))),
      ]
    )

    const test = modules[0]
    const lint = modules[1]

    const map = new Map<string, [string?, string?]>()
    test.forEach(d => map.set(d.path, [testReportXml, undefined]))
    // NOTE: Iterate over a set to avoid maching twice the same directory in lintDirectories
    new Set(lint).forEach(d => {
      if (map.has(d.path)) {
        map.set(d.path, [testReportXml, lintReportXml])
      } else {
        map.set(d.path, [undefined, lintReportXml])
      }
    })

    return new GoRepository(modules)
  }
}
