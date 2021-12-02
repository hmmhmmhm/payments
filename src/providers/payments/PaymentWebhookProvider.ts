import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { IPaymentHistory } from "../../api/structures/IPaymentHistory";
import { IPaymentWebhook } from "../../api/structures/IPaymentWebhook";
import { Fetcher } from "../../api/__internal/Fetcher";

import { PaymentHistory } from "../../models/PaymentHistory";

import { Configuration } from "../../Configuration";
import { PaymentHistoryProvider } from "./PaymentHistoryProvider";

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
        const payment: Data = await fetcher(history);
        const props = {
            ...propper(payment),
            data: JSON.stringify(payment, null, 4)
        };
        Object.assign(history, props);
        await history.update();

        // CONSTRUCT CURRENT HISTORY & DO WEBHOOK
        const current: IPaymentHistory = await PaymentHistoryProvider.json().getOne(history);
        const webhook: IPaymentWebhook = {
            source: current.source,
            previous,
            current
        };
        send(history, webhook).catch(() => {});
    }

    export async function send(history: PaymentHistory, input: IPaymentWebhook): Promise<void>
    {
        await Fetcher.fetch
        (
            { 
                host: history.webhook_url,
                encryption: Configuration.ENCRYPTION_PASSWORD 
            },
            { 
                input_encrypted: true, 
                output_encrypted: false 
            },
            "POST", "",
            input
        );
    }
}