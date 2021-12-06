import { PaymentConfiguration } from "../PaymentConfiguration";
import { PaymentGlobal } from "../PaymentGlobal";

import { start_updator_slave } from "./internal/start_updator_slave";

async function main(): Promise<void>
{
    // CONFIGURE MODE
    if (process.argv[2])
        PaymentGlobal.setMode(process.argv[2].toUpperCase() as "LOCAL");

    // START THE CLIENT
    await start_updator_slave(PaymentConfiguration.master_ip());
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});