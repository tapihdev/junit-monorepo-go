import { Reportable, TestResult, TestCase } from './type'

export class Unknown implements Reportable {
  constructor(private readonly _path: string) {}

  get directory(): string {
    const parsed = this._path.split('/').slice(0, -1).join('/')
    return parsed === '' ? '.' : parsed
  }

  get result(): TestResult {
    return TestResult.Unknown
  }

  get tests(): number {
    return 0
  }

  get passed(): number {
    return 0
  }

  get failed(): number {
    return 0
  }

  get skipped(): number {
    return 0
  }

  get time(): number | undefined {
    return undefined
  }

  get version(): string | undefined {
    return undefined
  }

  get failures(): TestCase[] {
    return []
  }
}
