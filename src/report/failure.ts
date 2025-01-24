import * as path from 'path'

import { ReporterType } from '../type'
import { FailureReport, FailureRecord, Index } from './type'

export class FailureReportImpl implements FailureReport {
  constructor(
    readonly type: ReporterType,
    readonly moduleDir: string,
    readonly subDir: string,
    readonly file: string,
    readonly line: number,
    readonly test: string,
    readonly message: string,
  ) {}

  toIndex(): Index {
    const fullPath = path.join(
      this.moduleDir,
      this.subDir,
      this.file
    )
    return `${fullPath}:${this.line}`
  }

  toRecord(): FailureRecord {
    const joinedMessage = this.message.replace(/\n/g, ' ')
    return {
      type: this.type.toString(),
      test: this.test,
      message: joinedMessage
    }
  }
}
