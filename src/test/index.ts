import * as cli from "cli";
import * as orm from "typeorm";

import payments from "../api";

import { PaymentBackend } from "../PaymentBackend";
import { PaymentConfiguration } from "../PaymentConfiguration";
import { PaymentGlobal } from "../PaymentGlobal";

import { DynamicImportIterator } from "./internal/DynamicImportIterator";
import { PaymentSetupWizard } from "../PaymentSetupWizard";
import { StopWatch } from "./internal/StopWatch";
import { MutexServer } from "mutex-server";
import { start_updator_master } from "../updator/internal/start_updator_master";
import { IUpdateController } from "../updator/internal/IUpdateController";

interface ICommand
{
    mode?: string;
    skipReset?: string;
}

async function main(): Promise<void>
{
    // SPECIALIZE MODE
    const command: ICommand = cli.parse();
    if (command.mode)
        PaymentGlobal.setMode(process.argv[2].toUpperCase() as "LOCAL");
    PaymentGlobal.testing = true;

    // PREPARE DATABASE
    const db: orm.Connection = await orm.createConnection(PaymentConfiguration.db_config());
    if (command.skipReset === undefined)
        await StopWatch.trace("Reset DB", () => PaymentSetupWizard.schema(db));

    // UPDATOR SERVER
    const updator: MutexServer<string, IUpdateController | null> = await start_updator_master();

    // BACKEND SERVER
    const backend: PaymentBackend = new PaymentBackend();
    await backend.open();

    //----
    // CLINET CONNECTOR
    //----
    // CONNECTION INFO
    const connection: payments.IConnection = {
        host: `http://127.0.0.1:${PaymentConfiguration.API_PORT}`,
        encryption: PaymentConfiguration.ENCRYPTION_PASSWORD
    };

    // DO TEST
    const exceptions: Error[] = await DynamicImportIterator.force
    (
        __dirname + "/features", 
        {
            prefix: "test", 
            parameters: [connection]
        }
    );

    // TERMINATE
    await backend.close();
    await db.close();
    await updator.close();

    if (exceptions.length === 0)
        console.log("Success");
    else
    {
        for (const exp of exceptions)
            console.log(exp);
        process.exit(-1);
    }
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});