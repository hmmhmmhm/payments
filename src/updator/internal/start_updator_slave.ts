import { MutexConnector } from "mutex-server";

import { PaymentConfiguration } from "../../PaymentConfiguration";
import { Updator } from "./Updator";

export async function start_updator_slave(host: string): Promise<MutexConnector<string, Updator>>
{
    const updator: Updator = new Updator();
    const connector: MutexConnector<string, Updator> = new MutexConnector(PaymentConfiguration.SYSTEM_PASSWORD, updator);
    await connector.connect(`ws://${host}:${PaymentConfiguration.UPDATOR_PORT}/slave`);
    return connector;
}