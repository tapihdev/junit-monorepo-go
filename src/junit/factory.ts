import * as fs from 'fs'
import path from 'path'
import { parseStringPromise } from 'xml2js'

import { JUnitReport, TestSuites, Reporter, ReporterType, GolangCILintReport, GotestsumReport } from './type'
import { GolangCILintReportImpl } from './golangcilint'
import { GotestsumReportImpl } from './gotestsum'

export interface MultiJunitReportersFactory {
  fromXml(
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GotestsumReport[], GolangCILintReport[]]>
}

export interface SingleJUnitReporterFactory {
  fromJSON(
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<Reporter>
}

export type FileReader = typeof fs.promises.readFile

// NOTE: xml2js returns an empty string instead of an empty object
type JUnitReportUnsafe = {
  testsuites: TestSuites | ''
}

export class SingleJUnitReporterFactoryImpl implements SingleJUnitReporterFactory {
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

export class MultiJunitReportersFactoryImpl {
  constructor(private _parser: SingleJUnitReporterFactory) { }

  async fromXml(
    testDirectories: string[],
    lintDirectories: string[],
    testReportXml: string,
    lintReportXml: string
  ): Promise<[GotestsumReport[], GolangCILintReport[]]> {
    const all = await Promise.all([
      await Promise.all(
        testDirectories.map(
          async (d) => (await this._parser.fromJSON(
            ReporterType.Gotestsum,
            d,
            testReportXml
          )) as GotestsumReport
        )
      ),
      await Promise.all(
        lintDirectories.map(
          async (d) => (await this._parser.fromJSON(
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
