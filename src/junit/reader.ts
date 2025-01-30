import * as fs from 'fs'
import path from 'path'
import { parseStringPromise } from 'xml2js'

import {
  JUnitReport,
  TestSuites,
} from './type'

export type FileReader = typeof fs.promises.readFile

// NOTE: xml2js returns an empty string instead of an empty object
type JUnitReportUnsafe = {
  testsuites: TestSuites | ''
}

export class JUnitXmlReader {
  constructor(private readonly reader: FileReader) {}

  async safeParse(    directory: string,
    fileName: string
): Promise<JUnitReport> {
    const content = await this.reader(path.join(directory, fileName), {
      encoding: 'utf8'
    })
    const parsedUnsafe = (await parseStringPromise(
      content
    )) as JUnitReportUnsafe
    if (parsedUnsafe.testsuites === '') {
      parsedUnsafe.testsuites = {}
    }

    return parsedUnsafe as JUnitReport
  }
}

