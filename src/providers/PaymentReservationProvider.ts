import safe from "safe-typeorm";
import { Singleton } from "tstl/thread/Singleton";

import imp from "iamport-server-api";
import toss from "toss-payments-server-api";
import { IIamportSubscription } from "iamport-server-api/lib/structures/IIamportSubscription";
import { ITossBilling } from "toss-payments-server-api/lib/structures/ITossBilling";
import { IPaymentReservation } from "../api/structures/IPaymentReservation";

import { PaymentReservation } from "../models/PaymentReservation";

import { IamportAsset } from "../services/iamport/IamportAsset";
import { TossAsset } from "../services/toss/TossAsset";

export namespace PaymentReservationProvider 
{
    /* -----------------------------------------------------------
        READER
    ----------------------------------------------------------- */
    export function json(): safe.JsonSelectBuilder<PaymentReservation, any, IPaymentReservation>
    {
        return json_builder_.get();
    }

    const json_builder_ = new Singleton(() => PaymentReservation.createJsonSelectBuilder
    (
        {},
        reservation => 
        {
            const output: IPaymentReservation = {
                id: reservation.id,
                vendor_code: reservation.vendor_code as "toss.payments",
                vendor: {
                    code: reservation.vendor_code as "toss.payments",
                    store_id: reservation.vendor_store_id,
                    uid: reservation.vendor_uid,
                },
                source: {
                    schema: reservation.source_schema,
                    table: reservation.source_table,
                    id: reservation.source_id,
                },
                title: reservation.title,
                data: JSON.parse(reservation.data),
                created_at: reservation.created_at,
            };
            return output;
        }
    ));

    /* -----------------------------------------------------------
        WEBHOOK
    ----------------------------------------------------------- */
    export async function collect
        (
            collection: safe.InsertCollection,
            input: IPaymentReservation.IStore
        ): Promise<PaymentReservation>
    {
        const data = input.vendor.code === "toss.payments"
            ? await get_toss_billing(input)
            : await get_iamport_subscription(input);
        const reservation: PaymentReservation = PaymentReservation.initialize({
            id: safe.DEFAULT,
            vendor_code: input.vendor.code,
            vendor_store_id: input.vendor.store_id,
            vendor_uid: input.vendor.uid,
            source_schema: input.source.schema,
            source_table: input.source.table,
            source_id: input.source.id,
            title: input.title,
            data: JSON.stringify(data, null, 4),
            created_at: safe.DEFAULT
        });
        await reservation.password.set(input.password);
        return collection.push(reservation);
    }

    function get_toss_billing(input: IPaymentReservation.IStore): Promise<ITossBilling>
    {
        return toss.functional.v1.billing.authorizations.at
        (
            TossAsset.connection(input.vendor.store_id),
            input.vendor.uid,
            {
                customerKey: input.source.id
            }
        );
    }

    async function get_iamport_subscription(input: IPaymentReservation.IStore): Promise<IIamportSubscription>
    {
        const { response } = await imp.functional.subscribe.customers.at
        (
            await IamportAsset.connection(input.vendor.store_id),
            input.vendor.uid
        );
        return response;
    }
}