import toss from "toss-payments-server-api";
import { ITossCardPayment } from "toss-payments-server-api/lib/structures/ITossCardPayment";

import { TossAsset } from "./TossAsset";

export namespace TossPaymentCardService
{
    export function store
        (
            mid: string,
            input: ITossCardPayment.IStore
        ): Promise<ITossCardPayment>
    {
        return toss.functional.payments.key_in
        (
            TossAsset.connection(mid),
            input
        );
    }
}