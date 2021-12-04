import { Vector } from "tstl/container/Vector";

import { IPaymentWebhook } from "../api/structures/IPaymentWebhook";

export namespace FakePaymentStorage
{
    export const webhooks: Vector<IPaymentWebhook> = new Vector();
}