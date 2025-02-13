import {spawn} from "child_process";

class VersionReader {
    /**
     * @type {boolean}
     * @private
     */
    _initialised = false;

    /**
     * @type {string}
     * @private
     */
    _versionOutput;

    /**
     * @type {{major: number, minor: number, revision: number}}
     * @private
     */
    _cliVersion;

    initIfRequired = async () => {
        if (!this._initialised) {
            try {
                this._versionOutput = await this.invokeVersionCommand();
            } catch(e) {
                if (e.message.startsWith('Error determining version')) {
                    this._versionOutput = await this.invokeVersionCommand('--version');
                } else {
                    throw e;
                }
            }
            this._initialised = true;
        }
    }

    invokeVersionCommand = (arg = 'version') => {
        return new Promise((resolve, reject) => {
            try {
                const proc = spawn('imposter', [arg]);
                let output = '';

                proc.on('error', err => {
                    reject(new Error(`Error determining version from 'imposter' command. Is Imposter CLI installed?\n${err}`));
                }).on('close', (code) => {
                    if (code === 0) {
                        resolve(output);
                    } else {
                        reject(new Error(`Error determining version. Imposter process terminated with code: ${code}`));
                    }
                });
                proc.stdout.on('data', chunk => {
                    if (chunk) {
                        output += chunk.toString();
                    }
                });
                proc.stderr.on('data', chunk => {
                    if (chunk) {
                        output += chunk.toString();
                    }
                });
            } catch (e) {
                reject(new Error(`Error spawning Imposter process: ${e}`));
            }
        })
    }

    /**
     * Determines the version of the CLI subcomponent.
     *
     * @param componentName {RegExp}
     * @returns {{major: number, minor: number, revision: number, cli: string}}
     */
    determineVersion = (componentName) => {
        if (!this._initialised) {
            throw new Error('initIfRequired() not called');
        }
        try {
            /*
             * Parse CLI output in the form:
             *
             * imposter-cli 0.1.0
             * imposter-engine 0.1.0
             *
             * ...filtering by componentName, into an array of Strings containing the SemVer components:
             * [ "0", "1", "0" ]
             */
            const version = this._versionOutput.split('\n')
                .filter(line => line.match(componentName))
                .map(cliVersion => cliVersion.split(' ')[1].trim().split('.'))[0];

            return {
                major: Number(version[0]),
                minor: Number(version[1]),
                revision: Number(version[2]),
                cli: 'imposter-cli',
            };

        } catch (e) {
            throw new Error(`Error parsing version '${this._versionOutput}': ${e}`);
        }
    }

    /**
     * Determine the version of the CLI.
     *
     * @returns {{major: number, minor: number, revision: number, cli: string}}
     */
    determineCliVersion = () => {
        if (!this._cliVersion) {
            try {
                this._cliVersion = this.determineVersion(/imposter-cli/);
            } catch(e) {
                if (e.message.startsWith('Error parsing version') && this._versionOutput.startsWith('Version: ')) {
                    const version = this._versionOutput.split('Version: ')[1].trim().split('.');
                    this._cliVersion = {
                        major: Number(version[0]),
                        minor: Number(version[1]),
                        revision: Number(version[2]),
                        cli: 'imposter',
                    }
                } else {
                    throw e;
                }
            }
        }
        return this._cliVersion;
    }

    /**
     * Runs the `block` if the CLI version is equal to or greater than the specified version.
     *
     * @param major {number}
     * @param minor {number}
     * @param revision {number}
     * @param block {function}
     * @param orElseBlock {function}
     * @returns {*|undefined}
     */
    runIfVersionAtLeast = (major, minor, revision, block, orElseBlock = undefined) => {
        const cliVersion = this.determineCliVersion();
        if (this.versionAtLeast({major, minor, revision}, cliVersion)) {
            return block();
        } else if (orElseBlock) {
            return orElseBlock();
        }
        return undefined;
    }

    /**
     * Determines if the `test` SemVer version is equal to or greater than `required`.
     * @param required {{major: number, minor: number, revision: number}}
     * @param test {{major: number, minor: number, revision: number}}
     * @returns {boolean}
     */
    versionAtLeast = (required, test) => {
        if (test.major > required.major) {
            return true;
        } else if (test.major === required.major) {
            if (test.minor > required.minor) {
                return true;
            } else if (test.minor === required.minor) {
                return (test.revision >= required.revision);
            }
        }
        return false;
    }
}

const versionReader = new VersionReader();

export {versionReader};
