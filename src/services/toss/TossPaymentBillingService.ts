import toss from "toss-payments-server-api";
import { ITossBilling } from "toss-payments-server-api/lib/structures/ITossBilling";
import { ITossPayment } from "toss-payments-server-api/lib/structures/ITossPayment";

import { TossAsset } from "./TossAsset";

export namespace TossPaymentBillingService
{
    export function store
        (
            mid: string,
            input: ITossBilling.IStore
        ): Promise<ITossBilling>
    {
        return toss.functional.billing.authorizations.card.store
        (
            TossAsset.connection(mid),
            input
        );
    }

    export function at
        (
            mid: string,
            input: ITossBilling.IAccessor
        ): Promise<ITossBilling>
    {
        return toss.functional.billing.authorizations.at
        (
            TossAsset.connection(mid), 
            input.authKey,
            input
        );
    }

    export function pay
        (
            mid: string,
            input: ITossBilling.IPaymentStore
        ): Promise<ITossPayment>
    {
        return toss.functional.billing.pay
        (
            TossAsset.connection(mid), 
            input.billingKey,
            input
        );
    }
}