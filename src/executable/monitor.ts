import payments from "../api";
import { PaymentConfiguration } from "../PaymentConfiguration";
import { PaymentGlobal } from "../PaymentGlobal";

import { IPerformance } from "../api/structures/monitors/IPerformance";
import { ISystem } from "../api/structures/monitors/ISystem";

async function main(): Promise<void>
{
    // CONFIGURE MODE
    if (process.argv[2])
        PaymentGlobal.setMode(process.argv[2].toUpperCase() as "LOCAL");

    // GET PERFORMANCE & SYSTEM INFO
    const connection: payments.IConnection = {
        host: `http://${PaymentConfiguration.master_ip()}:${PaymentConfiguration.API_PORT}`,
        encryption: PaymentConfiguration.ENCRYPTION_PASSWORD
    };
    const performance: IPerformance = await payments.functional.monitors.performance.get(connection);
    const system: ISystem = await payments.functional.monitors.system.get(connection);
    
    // TRACE THEM
    console.log({ performance, system });
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});