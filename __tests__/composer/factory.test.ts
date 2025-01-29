import * as fs from 'fs'

import { Result } from "../../src/type"
import { Table } from "../../src/table/typed"
import { GotestsumTable } from "../../src/composer/gotestsum"
import { GolangCILintTable } from "../../src/composer/golangcilint"
import { FailureTable } from "../../src/composer/failure"
import { JUnitReporterFactory } from "../../src/junit/factory"
import { TableSetFactory } from '../../src/composer/factory';
import { ReporterType, GitHubContext } from '../../src/type';

describe('TableSetFactory', () => {
  const mockGolangCILintTable = new Table(
    { index: 'Module', values: { result: 'Result' } },
    { index: '---', values: { result: '---:' } },
    [{ index: 'module1', values: { result: 'Passed' } }]
  );

  const mockGotestsumTable = new Table(
    { index: 'Module', values: { version: 'Version', result: 'Result', passed: 'Passed', failed: 'Failed', time: 'Time' } },
    { index: '---', values: { version: '---:', result: '---:', passed: '---:', failed: '---:', time: '---:' } },
    [{ index: 'module1', values: { version: '1.0.0', result: 'Passed', passed: '10', failed: '0', time: '1.5s' } }]
  );

  const mockFailureTable = new Table(
    { index: 'Test', values: { type: 'Type', test: 'Test', message: 'Message' } },
    { index: '---', values: { type: '---', test: '---', message: '---' } },
    [{ index: 'TestName', values: { type: 'failure', test: 'test', message: 'error' } }]
  );

  let fromXmlMock: jest.SpiedFunction<JUnitReporterFactory['fromXml']>;
  let golangCILintTableMock: jest.SpiedFunction<GolangCILintTable['toTable']>;
  let gotestsumTableMock: jest.SpiedFunction<GotestsumTable['toTable']>;
  let failureTableMock: jest.SpiedFunction<FailureTable['toTable']>;

  beforeEach(() => {
    fromXmlMock = jest.spyOn(JUnitReporterFactory.prototype, 'fromXml');
    golangCILintTableMock = jest.spyOn(GolangCILintTable.prototype, 'toTable').mockReturnValue(mockGolangCILintTable);
    gotestsumTableMock = jest.spyOn(GotestsumTable.prototype, 'toTable').mockReturnValue(mockGotestsumTable);
    failureTableMock = jest.spyOn(FailureTable.prototype, 'toTable').mockReturnValue(mockFailureTable);
  });

  describe('single', () => {
    const testCases = [
      {
        name: 'GolangCILint report',
        input: {
          xmlFileGroup: {
            type: ReporterType.GolangCILint,
            directories: ['/path/to/dir'],
            fileName: 'report.xml'
          },
          mockReport: {
            path: '/path/to/dir',
            result: Result.Passed,
            summary: { result: Result.Passed },
            failures: [{ type: 'failure', test: 'TestName', message: 'error' }]
          }
        },
        expected: {
          tableClass: GolangCILintTable,
          tableInput: [{ result: Result.Passed }],
          failureInput: [{ type: 'failure', test: 'TestName', message: 'error' }],
          annotations: ['error'],
          result: Result.Passed,
          summary: {
            columns: 2,
            rows: 1,
          },
          failures: {
            columns: 3,
            rows: 1,
          }
        }
      },
      {
        name: 'Gotestsum report',
        input: {
          xmlFileGroup: {
            type: ReporterType.Gotestsum,
            directories: ['/path/to/dir'],
            fileName: 'report.xml'
          },
          mockReport: {
            path: '/path/to/dir',
            result: Result.Passed,
            summary: { version: '1.0.0', result: Result.Passed, passed: '10', failed: '0', time: '1.5s' },
            failures: []
          }
        },
        expected: {
          tableClass: GotestsumTable,
          tableInput: [{ version: '1.0.0', result: Result.Passed, passed: '10', failed: '0', time: '1.5s' }],
          failureInput: [],
          annotations: [],
          result: Result.Passed,
          summary: {
            columns: 6,
            rows: 1,
          },
          failures: {
            columns: 3,
            rows: 1,
          }
        }
      }
    ];

    it.each(testCases)('should process $name correctly', async ({
      input,
      expected
    }) => {
      const factory = new TableSetFactory(new JUnitReporterFactory(fs.promises.readFile));
      const context: GitHubContext = {
        owner: 'owner',
        repo: 'repo',
        sha: 'sha',
      };

      fromXmlMock.mockResolvedValue(input.mockReport);

      const result = await factory.single(context, input.xmlFileGroup);

      expect(fromXmlMock).toHaveBeenCalledWith(
        context,
        input.xmlFileGroup.type,
        '/path/to/dir',
        'report.xml'
      );
      expect(expected.tableClass).toHaveBeenCalledWith(expected.tableInput);
      expect(FailureTable).toHaveBeenCalledWith(expected.failureInput);

      expect(result.result).toBe(expected.result);
      expect(result.summary.columns).toEqual(expected.summary.columns);
      expect(result.summary.rows).toEqual(expected.summary.rows);
      expect(result.failures.columns).toEqual(expected.failures.columns);
      expect(result.failures.rows).toEqual(expected.failures.rows);
      expect(result.annotations).toEqual(expected.annotations);
    });
  });
});


