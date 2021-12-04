import payments from "../../../api";

export async function test_api_monitor_health_check(connection: payments.IConnection): Promise<void>
{
    await payments.functional.monitors.health.get(connection);
}