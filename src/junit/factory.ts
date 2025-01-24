import * as fs from 'fs'
import path from 'path'
import { parseStringPromise } from 'xml2js'

import {
  JUnitReport,
  TestSuites,
  GolangCILintReporter,
  GotestsumReporter,
  AnyReporter
} from './type'
import { ReporterType, GitHubContext } from '../type'
import { GolangCILintReporterImpl } from './golangcilint'
import { GotestsumReporterImpl } from './gotestsum'

export interface MultiJunitReportersFactory {
  fromXml(
    context: GitHubContext,
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GotestsumReporter[], GolangCILintReporter[]]>
}

export interface SingleJUnitReporterFactory {
  fromXml(
    context: GitHubContext,
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<AnyReporter>
}

export type FileReader = typeof fs.promises.readFile

// NOTE: xml2js returns an empty string instead of an empty object
type JUnitReportUnsafe = {
  testsuites: TestSuites | ''
}

export class SingleJUnitReporterFactoryImpl
  implements SingleJUnitReporterFactory
{
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

export class MultiJunitReportersFactoryImpl
  implements MultiJunitReportersFactory
{
  constructor(private _parser: SingleJUnitReporterFactory) {}

  async fromXml(
    context: GitHubContext,
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GotestsumReporter[], GolangCILintReporter[]]> {
    const all = await Promise.all([
      await Promise.all(
        testDirectories.map(
          async d =>
            (await this._parser.fromXml(
              context,
              ReporterType.Gotestsum,
              d,
              testReportXml
            )) as GotestsumReporter
        )
      ),
      await Promise.all(
        lintDirectories.map(
          async d =>
            (await this._parser.fromXml(
              context,
              ReporterType.GolangCILint,
              d,
              lintReportXml
            )) as GolangCILintReporter
        )
      )
    ])

    return [all[0], all[1]]
  }
}
