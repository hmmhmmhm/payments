import { IPaymentHistory } from "./IPaymentHistory";
import { IPaymentSource } from "./IPaymentSource";

export interface IPaymentWebhook
{
    id: string;
    source: IPaymentSource;
    previous: IPaymentWebhook.IHistory;
    current: IPaymentWebhook.IHistory;
}
export namespace IPaymentWebhook
{
    export type IHistory = Omit<IPaymentHistory, "source">;
}