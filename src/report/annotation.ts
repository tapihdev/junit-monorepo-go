import { AnnotationRecord, Index, AnnotationReport } from './type'

export class AnnotationReportImpl implements AnnotationReport {
  constructor(
    readonly filePath: string,
    readonly line: number,
    readonly message: string,
  ) {}

  toIndex(): Index {
    return `${this.filePath}:${this.line}`
  }

  toRecord(): AnnotationRecord {
    return {
      body: `::error file=${this.filePath},line=${this.line}::${this.message}`
    }
  }
}
