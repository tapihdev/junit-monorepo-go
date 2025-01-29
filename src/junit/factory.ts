import * as fs from 'fs'
import path from 'path'
import { parseStringPromise } from 'xml2js'

import {
  JUnitReport,
  TestSuites,
  AnyReporter
} from './type'
import { ReporterType, GitHubContext } from '../type'
import { GolangCILintReporterImpl } from './golangcilint'
import { GotestsumReporterImpl } from './gotestsum'

export type FileReader = typeof fs.promises.readFile

// NOTE: xml2js returns an empty string instead of an empty object
type JUnitReportUnsafe = {
  testsuites: TestSuites | ''
}

export class JUnitReporterFactory {
  constructor(private readonly reader: FileReader) {}

  async fromXml(
    context: GitHubContext,
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<AnyReporter> {
    const content = await this.reader(path.join(directory, fileName), {
      encoding: 'utf8'
    })
    const parsed = await this.safeParse(content)

    switch (type) {
      case ReporterType.GolangCILint:
        return new GolangCILintReporterImpl(context, directory, parsed)
      case ReporterType.Gotestsum:
        return new GotestsumReporterImpl(context, directory, parsed)
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

