import { AnnotationRecord, Index, ReportableAnnotation } from './type'

export class AnnotationReport implements ReportableAnnotation {
  constructor(
    readonly filePath: string,
    readonly line: number,
    readonly message: string
  ) {}

  get index(): Index {
    return `${this.filePath}:${this.line}`
  }

  get record(): AnnotationRecord {
    return {
      body: `::error file=${this.filePath},line=${this.line}::${this.message}`
    }
  }
}
