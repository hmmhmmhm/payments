import { sleep_for } from "tstl/thread/global";

import payments from "../../api";
import { PaymentConfiguration } from "../../PaymentConfiguration";

import { ArrayUtil } from "../../utils/ArrayUtil";
import { Terminal } from "../../utils/Terminal";

async function main(): Promise<void>
{
    //----
    // PREPARATIONS
    //----
    // START UPDATOR SERVER
    await Terminal.execute("npm run start:updator:master");
    await sleep_for(1000);

    // START BACKEND SERVER
    await Terminal.execute("npm run start local xxxx yyyy zzzz");
    await sleep_for(4000);

    // API LIBRARY
    const connection: payments.IConnection = {
        host: `http://127.0.0.1:${PaymentConfiguration.API_PORT}`,
        encryption: PaymentConfiguration.ENCRYPTION_PASSWORD
    };
    
    sleep_for(1000).then(async () => 
    {
        console.log("Start updating");
        await Terminal.execute("npm run update");
        console.log("The update has been completed");
    }).catch(() => {});

    try
    {
        await Promise.all(ArrayUtil.repeat(600, async i =>
        {
            await sleep_for(i * 10);
            await payments.functional.monitors.system.sleep(connection, 3000);
        }));
    }
    catch (exp)
    {
        throw exp;
    }
    await Terminal.execute("npm run stop");
    await Terminal.execute("npm run stop:updator:master");
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});