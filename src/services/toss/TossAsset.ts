import btoa from "btoa";

import FakeToss from "fake-toss-payments-server";
import toss from "toss-payments-server-api";

import { Configuration } from "../../Configuration";
import { SGlobal } from "../../SGlobal";

export namespace TossAsset
{
    export function connection(storeId: string): toss.IConnection
    {
        if (SGlobal.testing === true)
            return {
                host: `http://127.0.0.1:${FakeToss.Configuration.API_PORT}`,
                headers: {
                    "Authorization": `Basic ${btoa("test_ak_ZORzdMaqN3wQd5k6ygr5AkYXQGwy")}`
                }
            };
        else
            return {
                host: "https://api.tosspayments.com/v1",
                headers: {
                    "Authorzation": `Basic ${Configuration.toss_secret_key(storeId)}`
                }
            };
    }
}