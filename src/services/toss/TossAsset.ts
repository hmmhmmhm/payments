import btoa from "btoa";
import fake from "fake-toss-payments-server";
import toss from "toss-payments-server-api";

import { PaymentConfiguration } from "../../PaymentConfiguration";
import { PaymentGlobal } from "../../PaymentGlobal";

export namespace TossAsset
{
    export function connection(storeId: string): toss.IConnection
    {
        if (PaymentGlobal.testing === true)
            return {
                host: `http://127.0.0.1:${fake.TossFakeConfiguration.API_PORT}`,
                headers: {
                    "Authorization": `Basic ${btoa("test_ak_ZORzdMaqN3wQd5k6ygr5AkYXQGwy")}`
                }
            };
        else
            return {
                host: "https://api.tosspayments.com/v1",
                headers: {
                    "Authorzation": `Basic ${PaymentConfiguration.toss_secret_key(storeId)}`
                }
            };
    }
}