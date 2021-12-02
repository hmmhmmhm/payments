import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { ITossPaymentWebhook } from "toss-payments-server-api/lib/structures/ITossPaymentWebhook";
import { PaymentWebhookProvider } from "../../providers/payments/PaymentWebhookProvider";
import { IamportPaymentService } from "../../services/iamport/IamportPaymentService";
import { ITossPayment } from "toss-payments-server-api/lib/structures/ITossPayment";
import { TossPaymentService } from "../../services/toss/TossPaymentService";

@nest.Controller("webhooks")
export class PaymentWebhooksController
{
    /**
     * @internal
     */
    @helper.TypedRoute.Post("webhook")
    public async iamport
        (
            @nest.Body() input: IIamportPayment.IWebhook
        ): Promise<void>
    {
        await PaymentWebhookProvider.process<IIamportPayment.IWebhook, IIamportPayment>
        (
            "iamport",
            input => input.status !== "ready" && input.status !== "failed" 
                ? input.imp_uid
                : null,
            history => IamportPaymentService.at(history.vendor_store_id, history.vendor_uid),
            IamportPaymentService.parse,
            input,
        );
    }

    /**
     * @internal
     */
    @helper.TypedRoute.Post("toss")
    public async toss
        (
            @nest.Body() input: ITossPaymentWebhook
        ): Promise<void>
    {
        await PaymentWebhookProvider.process<ITossPaymentWebhook, ITossPayment>
        (
            "toss.payments",
            input => input.data.status !== "WAITING_FOR_DEPOSIT"
                ? input.data.paymentKey
                : null,
            history => TossPaymentService.at(history.vendor_store_id, history.vendor_uid),
            TossPaymentService.parse,
            input
        );
    }
}