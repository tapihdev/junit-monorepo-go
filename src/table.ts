import { AnyRecord } from './type'

export class Table<T extends AnyRecord> {
  constructor(
    private readonly header: T,
    private readonly separator: T,
    private readonly records: T[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return Object.keys(this.header).length
  }

  render(): string {
    if (this.rows === 0) {
      return ''
    }

    return [
      `| ${Object.values(this.header).join(' | ')} |`,
      `| ${Object.values(this.separator).join(' | ')} |`,
      ...this.records.map(r => `| ${Object.values(r).join(' | ')} |`)
    ].join('\n')
  }
}
