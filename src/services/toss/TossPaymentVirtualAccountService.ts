import toss from "toss-payments-server-api";
import { ITossVirtualAccountPayment } from "toss-payments-server-api/lib/structures/ITossVirtualAccountPayment";

import { TossAsset } from "./TossAsset";

export namespace TossPaymentVirtualAccountService
{
    export function store
        (
            storeId: string,
            input: ITossVirtualAccountPayment.IStore
        ): Promise<ITossVirtualAccountPayment>
    {
        return toss.functional.v1.virtual_accounts.store
        (
            TossAsset.connection(storeId),
            input
        );
    }
}