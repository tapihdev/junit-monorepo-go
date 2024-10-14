import * as path from "path";
import { GotestsumReport } from "./junit/reporter/gotestsum";

export class Module {
  constructor(
    private readonly _directory: string,
    private readonly _testReport: GotestsumReport
  ) {}

  static async fromXML(
    directory: string,
    testPath: string,
  ): Promise<Module> {
    return new Module(directory, await GotestsumReport.fromXml(path.join(directory, testPath)))
  }

  get directory(): string {
    return this._directory
  }
}