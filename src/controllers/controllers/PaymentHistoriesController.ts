import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import { assertType } from "typescript-is";

import { IPaymentHistory } from "../../api/structures/IPaymentHistory";
import { IPaymentSource } from "../../api/structures/IPaymentSource";

import { PaymentHistory } from "../../models/PaymentHistory";

import { PaymentHistoryProvider } from "../../providers/payments/PaymentHistoryProvider";

@nest.Controller("payments/histories")
export class PaymentHistoriesController
{
    /**
     * 결제 내역 상세 조회하기.
     * 
     * @param input 결제 내역의 원천 정보.
     * @returns 결제 내역
     */
    @helper.EncryptedRoute.Patch("get")
    public async get
        (
            @helper.EncryptedBody() input: IPaymentSource.IAccessor
        ): Promise<IPaymentHistory>
    {
        assertType<typeof input>(input);

        const payment: PaymentHistory = await PaymentHistory.findOneOrFail({
            source_schema: input.schema,
            source_table: input.table,
            source_id: input.id
        });
        if (await payment.password.equals(input.password) === false)
            throw new nest.ForbiddenException("Wrong password.");

        return await PaymentHistoryProvider.json().getOne(payment);
    }

    /**
     * 결제 내역 상세 조회하기.
     * 
     * @param id Primary Key
     * @param input 결제 내역의 비밀번호
     * @returns 결제 내역
     */
    @helper.EncryptedRoute.Patch(":id")
    public async at
        (
            @helper.TypedParam("id", "string") id: string,
            @helper.EncryptedBody() input: IPaymentSource.IPassword
        ): Promise<IPaymentHistory>
    {
        assertType<typeof input>(input);

        const payment: PaymentHistory = await PaymentHistory.findOneOrFail(id);
        if (await payment.password.equals(input.password) === false)
            throw new nest.ForbiddenException("Wrong password.");

        return await PaymentHistoryProvider.json().getOne(payment);
    }

    /**
     * 결제 내역 발행하기.
     * 
     * @param input SDK 로부터 받은 정보
     * @returns 결제 내역
     */
    @helper.EncryptedRoute.Post()
    public async store
        (
            @helper.EncryptedBody() input: IPaymentHistory.IStore
        ): Promise<IPaymentHistory>
    {
        assertType<typeof input>(input);

        const history: PaymentHistory = await PaymentHistoryProvider.store(input);
        return await PaymentHistoryProvider.json().getOne(history);
    }
}