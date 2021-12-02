import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import { sleep_for } from "tstl/thread/global";

import { ISystem } from "../../api/structures/monitors/ISystem";

import { SystemProvider } from "../../providers/monitors/SystemProvider";

@nest.Controller("monitors/system")
export class SystemController
{
    @helper.EncryptedRoute.Get()
    public async get(): Promise<ISystem>
    {
        return {
            uid: SystemProvider.uid,
            arguments: process.argv,
            commit: await SystemProvider.commit(),
            package: await SystemProvider.package(),
            created_at: SystemProvider.created_at.toString(),
        };
    }
    
    @helper.EncryptedRoute.Get("sleep/:ms")
    public async sleep
        (
            @helper.TypedParam("ms", "number") ms: number
        ): Promise<ISystem>
    {
        await sleep_for(ms);
        return await this.get();
    }
}