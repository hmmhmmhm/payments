import { DomainError } from "tstl/exception/DomainError";

import imp from "iamport-server-api";
import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { IIamportPaymentCancel } from "iamport-server-api/lib/structures/IIamportPaymentCancel";

import { IPaymentHistory } from "../../api/structures/IPaymentHistory";

import { ErrorUtil } from "../../utils/ErrorUtil";
import { IamportAsset } from "./IamportAsset";

export namespace IamportPaymentService
{
    export async function at(storeId: string, imp_uid: string): Promise<IIamportPayment>
    {
        const output = await imp.functional.payments.at
        (
            await IamportAsset.connection(storeId),
            imp_uid
        );
        return output.response;
    }

    export async function approve
        (
            storeId: string,
            imp_uid: string,
            merchant_uid: string, 
            amount: number
        ): Promise<IIamportPayment>
    {
        const payment: IIamportPayment = await IamportPaymentService.at(storeId, imp_uid);
        if (amount !== payment.amount)
        {
            await ErrorUtil.log("IamportPaymentService.approve()", { ...payment, storeId, imp_uid, amount });
            await cancel
            (
                storeId, 
                {
                    imp_uid, 
                    reason: "잘못된 금액을 결제함",
                    merchant_uid,
                    checksum: null,
                    amount,
                }
            );
            throw new DomainError(`IamportPaymentService.approve(): wrong paid amount. It must be not ${amount} but ${payment.amount}.`);
        }
        return payment;
    }

    export function parse(payment: IIamportPayment): IPaymentHistory.IProps
    {
        return {
            currency_unit: "KRW",
            price: payment.amount,
            paid_at: payment.paid_at
                ? new Date(payment.paid_at * 1000)
                : null,
            cancelled_at: payment.status === "cancelled"
                ? new Date()
                : null,
        };
    }

    export async function cancel(storeId: string, input: IIamportPaymentCancel.IStore): Promise<void>
    {
        await imp.functional.payments.cancel
        (
            await IamportAsset.connection(storeId),
            input
        );
    }
}