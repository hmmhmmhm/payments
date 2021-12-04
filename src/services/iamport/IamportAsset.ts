import fake from "fake-iamport-server";
import imp from "iamport-server-api";
import { VariadicSingleton } from "tstl/thread/VariadicSingleton";

import { PaymentConfiguration } from "../../PaymentConfiguration";
import { SGlobal } from "../../SGlobal";

export namespace IamportAsset
{
    export async function connection(storeId: string): Promise<imp.IConnection>
    {
        const connector: imp.IamportConnector = connector_singleton_.get
        (
            SGlobal.mode, 
            SGlobal.testing, 
            storeId
        );
        return await connector.get();
    }

    const connector_singleton_: VariadicSingleton<imp.IamportConnector, [typeof SGlobal.mode, boolean, string]> = 
        new VariadicSingleton((_mode, testing, storeId) => 
        {
            if (testing === true)
                return new imp.IamportConnector
                (
                    `http://127.0.0.1:${fake.FakeIamportConfiguration.API_PORT}`,
                    {
                        imp_key: "test_imp_key",
                        imp_secret: "test_imp_secret"
                    }
                );
            else
                return new imp.IamportConnector
                (
                    "https://api.iamport.kr",
                    PaymentConfiguration.iamport_user_accessor(storeId)
                );
        });
}