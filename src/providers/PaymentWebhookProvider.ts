import safe from "safe-typeorm";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { IPaymentHistory } from "../api/structures/IPaymentHistory";
import { IPaymentWebhook } from "../api/structures/IPaymentWebhook";
import { Fetcher } from "../api/__internal/Fetcher";

import { PaymentHistory } from "../models/PaymentHistory";
import { PaymentHistoryWebhook } from "../models/PaymentHistoryWebhook";

import { PaymentConfiguration } from "../PaymentConfiguration";
import { PaymentHistoryProvider } from "./PaymentHistoryProvider";
import { PaymentHistoryWebhookResponse } from "../models/PaymentHistoryWebhookResponse";

export namespace PaymentWebhookProvider
{
    export async function process<Input extends object, Data extends object>
        (
            vendor_code: "toss.payments" | "iamport",
            uidGetter: (input: Input) => string | null,
            fetcher: (history: PaymentHistory) => Promise<Data>,
            propper: (data: Data) => IPaymentHistory.IProps,
            input: Input
        ): Promise<void>
    {
        // NEED NOT TO DO ANYIHTNG
        const vendor_uid: string | null = uidGetter(input);
        if (vendor_uid === null)
            return;

        // GET PREVIOUS HISTORY
        const history: PaymentHistory = await PaymentHistory.findOneOrFail({
            vendor_code,
            vendor_uid
        });

        const previous: IPaymentHistory = await PaymentHistoryProvider.json().getOne(history);
        if (previous.vendor.code !== vendor_code)
            throw new InvalidArgument(`Vendor of the payment is not "${vendor_code}" but "${history.vendor_code}""`);

        // UPDATE HISTORY WITH RELOADING
        const collection: safe.InsertCollection = new safe.InsertCollection();
        const payment: Data = await fetcher(history);
        const props = {
            ...propper(payment),
            data: JSON.stringify(payment, null, 4)
        };
        Object.assign(history, props);
        collection.before(() => history.update());

        // CONSTRUCT CURRENT HISTORY & DO WEBHOOK
        const current: IPaymentHistory = await PaymentHistoryProvider.json().getOne(history, false);
        const webhook: PaymentHistoryWebhook = PaymentHistoryWebhook.initialize({
            id: safe.DEFAULT,
            created_at: safe.DEFAULT,
            history,
            previous: JSON.stringify(previous),
            current: JSON.stringify(current),
            data: JSON.stringify(input)
        });
        collection.push(webhook);
        await collection.execute();

        const request: IPaymentWebhook = {
            id: webhook.id,
            source: current.source,
            previous,
            current
        };
        send(history, webhook, request).catch(() => {});
    }

    async function send
        (
            history: PaymentHistory,
            webhook: PaymentHistoryWebhook,
            request: IPaymentWebhook
        ): Promise<void>
    {
        let status: number | null = null;
        let body: string | null = null;

        try
        {
            const response: Response = await Fetcher.fetch
            (
                { 
                    host: history.webhook_url,
                    encryption: PaymentConfiguration.ENCRYPTION_PASSWORD 
                },
                { 
                    input_encrypted: true, 
                    output_encrypted: false 
                },
                "POST", 
                "",
                request
            );
            status = response.status;
            body = await response.text();
        }
        catch {}

        const response: PaymentHistoryWebhookResponse = PaymentHistoryWebhookResponse.initialize({
            id: safe.DEFAULT,
            created_at: safe.DEFAULT,
            webhook,
            status,
            body
        });
        await response.insert();
    }
}