import safe from "safe-typeorm";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { Singleton } from "tstl/thread/Singleton";

import { HttpError } from "../../api/HttpError";
import { IPaymentHistory } from "../../api/structures/IPaymentHistory";
import { IPaymentWebhook } from "../../api/structures/IPaymentWebhook";

import { PaymentHistory } from "../../models/PaymentHistory";

import { IamportPaymentService } from "../../services/iamport/IamportPaymentService";
import { TossPaymentService } from "../../services/toss/TossPaymentService";

export namespace PaymentHistoryProvider
{
    /* -----------------------------------------------------------
        READER
    ----------------------------------------------------------- */
    export function json()
    {
        return json_builder_.get();
    }

    const json_builder_ = new Singleton(() => PaymentHistory.createJsonSelectBuilder
    (
        {},
        history => 
        {
            const output: IPaymentHistory = {
                id: history.id,
                vendor_code: history.vendor_code as "toss.payments",
                vendor: {
                    code: history.vendor_code as "toss.payments",
                    uid: history.vendor_uid,
                    store_id: history.vendor_store_id,
                },
                source: {
                    schema: history.source_schema,
                    table: history.source_table,
                    id: history.source_id,
                },
                webhook_url: history.webhook_url,
                currency_unit: history.currency_unit,
                price: history.price,
                data: JSON.parse(history.data),
                created_at: history.created_at,
                paid_at: history.paid_at,
                cancelled_at: history.cancelled_at
            };
            return output;
        }
    ));

    /* -----------------------------------------------------------
        WEBHOOK
    ----------------------------------------------------------- */
    export async function webhook
        (
            history: PaymentHistory,
            input: IPaymentWebhook
        ): Promise<void>
    {
        const response: Response = await fetch(history.webhook_url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(input)
        });
        if (response.status !== 200 && response.status !== 201)
            throw new HttpError
            (
                "POST", 
                history.webhook_url, 
                response.status,
                await response.text()
            );
    }

    /* -----------------------------------------------------------
        STORE
    ----------------------------------------------------------- */
    export async function store
        (
            input: IPaymentHistory.IStore
        ): Promise<PaymentHistory>
    {
        const collection: safe.InsertCollection = new safe.InsertCollection();
        const history: PaymentHistory = await collect(collection, input);
        await collection.execute();
        return history;
    }

    async function collect
        (
            collection: safe.InsertCollection,
            input: IPaymentHistory.IStore,
        ): Promise<PaymentHistory>
    {
        const [data, props] = await approve(input);
        const history: PaymentHistory = PaymentHistory.initialize({
            id: safe.DEFAULT,
            vendor_code: input.vendor.code,
            vendor_store_id: input.vendor.store_id,
            vendor_uid: input.vendor.uid,
            source_schema: input.source.schema,
            source_table: input.source.table,
            source_id: input.source.id,
            webhook_url: input.webhook_url,
            created_at: safe.DEFAULT,
            ...props,
            data: JSON.stringify(data, null, 4)
        });
        await history.password.set(input.password);

        return collection.push(history);
    }

    async function approve
        (
            input: IPaymentHistory.IStore
        ): Promise<[object, IPaymentHistory.IProps]>
    {
        if (input.vendor.code === "iamport")
        {
            const data = await IamportPaymentService.approve
            (
                input.vendor.store_id,
                input.vendor.uid,
                input.source.id,
                input.price
            );
            return [data, IamportPaymentService.parse(data)];
        }
        else if (input.vendor.code === "toss.payments")
        {
            const data = await TossPaymentService.approve
            (
                input.vendor.store_id, 
                input.vendor.uid, 
                {
                    amount: input.price,
                    orderId: input.source.id
                }
            );
            return [data, TossPaymentService.parse(data)];
        }
        else
            throw new InvalidArgument(`Unknown vendor.`);
    }
}