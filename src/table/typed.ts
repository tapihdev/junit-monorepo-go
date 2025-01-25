export type Row<T extends Record<string, string | undefined>> = {
  readonly index: string
  readonly values: T
}

export class Table<T extends Record<string, string | undefined>> {
  constructor(
    readonly header: Row<T>,
    readonly separator: Row<T>,
    readonly records: Row<T>[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return Object.keys(this.header.values).length
  }

  static concatVertical<T extends Record<string, string | undefined>>(table1: Table<T>, table2: Table<T>): Table<T> {
    return new Table(
      table1.header,
      table1.separator,
      [...table1.records, ...table2.records]
    )
  }

  toString(): string {
    if (this.rows === 0) {
      return ''
    }

    const header = `| ${this.header.index} | ${Object.values(this.header.values).join(' | ')} |`
    const separator = `| ${this.separator.index} | ${Object.values(this.separator.values).join(' | ')} |`

    return [
      header,
      separator,
      ...this.records.map(r => `| ${r.index} | ${Object.values(r.values).join(' | ')} |`)
    ].join('\n')
  }
}