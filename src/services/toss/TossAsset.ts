import btoa from "btoa";
import fake from "fake-toss-payments-server";
import toss from "toss-payments-server-api";

import { PaymentConfiguration } from "../../PaymentConfiguration";
import { PaymentGlobal } from "../../PaymentGlobal";

export namespace TossAsset
{
    export function connection(storeId: string): toss.IConnection
    {
        const host: string = PaymentGlobal.testing === true
            ? `http://127.0.0.1:${fake.TossFakeConfiguration.API_PORT}`
            : "https://api.tosspayments.com/v1";
        const Authorization: string = `Basic ${btoa(PaymentConfiguration.toss_secret_key(storeId))}`;
        
        return {
            host,
            headers: { Authorization }
        };
    }
}