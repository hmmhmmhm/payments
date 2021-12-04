import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { IPaymentWebhook } from "../api/structures/IPaymentWebhook";

import { FakePaymentStorage } from "../providers/FakePaymentStorage";

@nest.Controller("internal")
export class PaymentInternalController
{
    /**
     * @internal
     */
    @helper.EncryptedRoute.Post("webhook")
    public webhook
        (
            @helper.EncryptedBody() input: IPaymentWebhook
        ): void
    {
        FakePaymentStorage.webhooks.push_back(input);
    }
}