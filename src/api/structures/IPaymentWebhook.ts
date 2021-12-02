import { IPaymentHistory } from "./IPaymentHistory";
import { IPaymentSource } from "./IPaymentSource";

export interface IPaymentWebhook
{
    source: IPaymentSource;
    previous: IPaymentWebhook.IHistory | null;
    current: IPaymentWebhook.IHistory;
}
export namespace IPaymentWebhook
{
    export type IHistory = Omit<IPaymentHistory, "source">;
}