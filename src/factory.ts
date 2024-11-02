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
    const map = new Map<string, [string?, string?]>()
    testDirectories.forEach(d => map.set(d, [testReportXml, undefined]))
    lintDirectories.forEach(d => {
      if (map.has(d)) {
        map.set(d, [testReportXml, lintReportXml])
      } else {
        map.set(d, [undefined, lintReportXml])
      }
    })
    const modules = await Promise.all(
      Array.from(map.entries()).map(
        async ([directory, [testPath, lintPath]]) => {
          const [test, lint] = await Promise.all([
            testPath
              ? new GotestsumReport(
                  await this._parser(path.join(directory, testPath))
                )
              : undefined,
            lintPath
              ? new GolangCILintReport(
                  await this._parser(path.join(directory, lintPath))
                )
              : undefined
          ])
          return new GoModule(directory, test, lint)
        }
      )
    )
    return new GoRepository(modules)
  }
}
