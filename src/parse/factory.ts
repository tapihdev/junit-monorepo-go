import { AnyParsable } from './type'
import { ReporterType, GitHubContext } from '../common/type'
import { GolangCILintParser } from './golangcilint'
import { GotestsumParser } from './gotestsum'
import { JUnitXmlReader } from './reader'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertNever = (_: never): never => {
  throw new Error('exhaustiveness check')
}

export class JUnitReporterFactory {
  constructor(private readonly reader: JUnitXmlReader) {}

  async fromXml(
    context: GitHubContext,
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<AnyParsable> {
    const parsed = await this.reader.safeParse(directory, fileName)

    switch (type) {
      case ReporterType.GolangCILint:
        return new GolangCILintParser(context, directory, parsed)
      case ReporterType.Gotestsum:
        return new GotestsumParser(context, directory, parsed)
      default:
        return assertNever(type)
    }
  }
}
