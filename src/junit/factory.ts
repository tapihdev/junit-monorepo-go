import * as fs from 'fs'
import path from 'path'
import { parseStringPromise } from 'xml2js'

import { JUnitReport, TestSuites, Reporter, ReporterType } from './type'
import { GolangCILintReportImpl } from './golangcilint'
import { GotestsumReportImpl } from './gotestsum'

export type FileReader = typeof fs.promises.readFile

export interface JUnitReporterFactory {
  fromJSON(
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<Reporter>
}

export class JUnitReporterFactoryImpl implements JUnitReporterFactory {
  constructor(private readonly reader: FileReader) {}

  async fromJSON(
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<Reporter> {
    const content = await this.reader(path.join(directory, fileName), {
      encoding: 'utf8'
    })
    const parsed = await this.safeParse(content)

    switch (type) {
      case ReporterType.GolangCILint:
        return new GolangCILintReportImpl(directory, parsed)
      case ReporterType.Gotestsum:
        return new GotestsumReportImpl(directory, parsed)
    }
  }

  private async safeParse(content: string): Promise<JUnitReport> {
    const parsedUnsafe = (await parseStringPromise(
      content
    )) as JUnitReportUnsafe
    if (parsedUnsafe.testsuites === '') {
      parsedUnsafe.testsuites = {}
    }

    return parsedUnsafe as JUnitReport
  }
}

// NOTE: xml2js returns an empty string instead of an empty object
type JUnitReportUnsafe = {
  testsuites: TestSuites | ''
}
