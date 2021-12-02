import FakeIamport from "fake-iamport-server";
import imp from "iamport-server-api";
import { VariadicSingleton } from "tstl/thread/VariadicSingleton";
import { Configuration } from "../../Configuration";

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
                    `http://127.0.0.1:${FakeIamport.Configuration.API_PORT}`,
                    {
                        imp_key: "test_imp_key",
                        imp_secret: "test_imp_secret"
                    }
                );
            else
                return new imp.IamportConnector
                (
                    "https://api.iamport.kr",
                    Configuration.iamport_user_accessor(storeId)
                );
        });
}