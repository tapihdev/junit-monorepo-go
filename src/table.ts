export type Record<T extends Object> = {
  readonly index: string
  readonly record: T
}

export class Table<T extends Object> {
  constructor(
    readonly header: Record<T>,
    readonly separator: Record<T>,
    readonly records: Record<T>[]
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
      `| ${this.header.index} | ${Object.values(this.header.record).join(' | ')} |`,
      `| ${this.separator.index} | ${Object.values(this.separator.record).join(' | ')} |`,
      ...this.records.map(
        r => `| ${r.index} | ${Object.values(r.record).join(' | ')} |`
      )
    ].join('\n')
  }
}
