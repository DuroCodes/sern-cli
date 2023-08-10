import { getConfig } from '../utilities/getConfig';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'url';

export async function publish(commandDir: string | undefined, args: Partial<PublishArgs>) {
    const config = await getConfig();
    // pass in args into the command.
    const rootPath = new URL('../', import.meta.url),
        publishScript = new URL('./dist/create-publish.js', rootPath);
    // assign args.import to empty array if non existent
    args.import ??= [];

    args.token && console.info('token passed through command line');
    args.applicationId && console.info('applicationId passed through command line');
    commandDir && console.info('Publishing with override path: ', commandDir);

    const dotenvLocation = new URL('./node_modules/dotenv/config.js', rootPath),
        esmLoader = new URL('./node_modules/@esbuild-kit/esm-loader/dist/index.js', rootPath);

    // We dynamically load the create-publish script in a child process so that we can pass the special
    // loader flag to require typescript files
    const command = fork(fileURLToPath(publishScript), [], {
        execArgv: ['--loader', esmLoader.toString(), '-r', fileURLToPath(dotenvLocation), '--no-warnings'],
        env: {
            token: args.token ?? '',
            applicationId: args.applicationId ?? '',
        },
    });
    // send paths object so we dont have to recalculate it in script
    command.send({ config, preloads: args.import, commandDir });
}

interface PublishArgs {
    import: string[];
    token: string;
    applicationId: string;
}