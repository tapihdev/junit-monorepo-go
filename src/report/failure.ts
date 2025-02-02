import * as path from 'path'

import { ReporterType, GitHubContext } from '../common/type'
import { FailureReport, FailureRecord, Index, AnnotationReport } from './type'
import { AnnotationReportImpl } from './annotation'

export class FailureReportImpl implements FailureReport {
  constructor(
    readonly context: GitHubContext,
    readonly type: ReporterType,
    readonly moduleDir: string,
    readonly subDir: string,
    readonly file: string,
    readonly line: number,
    readonly test: string,
    readonly message: string
  ) {}

  get index(): Index {
    const { owner, repo, sha } = this.context
    const fullPath = path.join(this.moduleDir, this.subDir, this.file)
    const fileTitle = `${fullPath}:${this.line}`
    const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${this.line}`
    return `[${fileTitle}](${fileLink})`
  }

  get record(): FailureRecord {
    const joinedMessage = this.message.replace(/\n/g, ' ')
    return {
      type: this.type.toString(),
      test: this.test,
      message: joinedMessage
    }
  }

  get annotation(): AnnotationReport {
    return new AnnotationReportImpl(
      path.join(this.moduleDir, this.subDir, this.file),
      this.line,
      this.message
    )
  }
}
