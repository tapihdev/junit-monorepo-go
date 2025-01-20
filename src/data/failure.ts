import * as path from 'path'

import { Failure } from '../junit/type'
import { FailureSummaryView } from './type'

export class FailureSummaryViewImpl implements FailureSummaryView {
  constructor(
    readonly path: string,
    private readonly _failure: Failure,
  ) {}

  render(
    owner: string,
    repo: string,
    sha: string
  ) {
    const fullPath = path.join(this.path, this._failure.subDir, this._failure.file)
    const fileTitle = `${fullPath}:${this._failure.line}`
    const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${this._failure.line}`
    const fileColumn = `[${fileTitle}](${fileLink})`
    const joinedMessage = this._failure.message.replace(/\n/g, ' ')
    return { file: fileColumn, test: this._failure.test, message: joinedMessage }
  }
}