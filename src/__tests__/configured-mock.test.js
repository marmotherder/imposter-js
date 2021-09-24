import {beforeAll, expect, it} from '@jest/globals';
import {writeChunk, ConfiguredMock} from "../configured-mock";
import {versionReader} from "../version";

/**
 * The majority of coverage for `ConfiguredMock` comes via
 * the `MockBuilder` tests and integrated tests.
 */

beforeAll(() => {
    return versionReader.initIfRequired();
});

it('generates debug advice', async () => {
    const expected = `
See log file: /tmp/example
Consider setting .verbose() on your mock for more details.
Run 'imposter doctor' to diagnose engine issues.`

    const configuredMock = new ConfiguredMock('dir', 8080);
    expect(configuredMock.buildDebugAdvice(true, false, '/tmp/example')).toEqual(expected);
});

it('writes chunk to console', async () => {
    let consoleOutput = '';
    const fakeConsole = (chunk) => {
        consoleOutput += chunk;
    };

    writeChunk('foo', true, false, fakeConsole, null);

    expect(consoleOutput).toEqual('foo');
});

it('writes chunk to stream', async () => {
    let consoleOutput = '';
    const fakeStream = {
        write(chunk) {
            consoleOutput += chunk;
        }
    };

    writeChunk('foo', false, true, null, fakeStream);

    expect(consoleOutput).toEqual('foo');
});
