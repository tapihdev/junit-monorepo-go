import * as path from 'path'

import { Failure } from '../junit/type'
import { AnnotationView } from './type'

export class Annotation implements AnnotationView {
  constructor(
    readonly path: string,
    private readonly _failure: Failure
  ) {}

  render() {
    const fullPath = path.join(
      this.path,
      this._failure.subDir,
      this._failure.file
    )
    return {
      body: `::error file=${fullPath},line=${this._failure.line}::${this._failure.message}`
    }
  }
}
