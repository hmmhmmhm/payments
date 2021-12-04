import { assertType } from "typescript-is";
import payments from "../../../api";
import { ISystem } from "../../../api/structures/monitors/ISystem";

export async function test_api_monitor_system(connection: payments.IConnection): Promise<void>
{
    const system: ISystem = await payments.functional.monitors.system.get(connection);
    assertType<typeof system>(system);
}