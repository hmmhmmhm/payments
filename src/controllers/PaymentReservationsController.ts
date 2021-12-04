import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import safe from "safe-typeorm";
import { assertType } from "typescript-is";

import { IPaymentReservation } from "../api/structures/IPaymentReservation";
import { IPaymentSource } from "../api/structures/IPaymentSource";

import { PaymentReservation } from "../models/PaymentReservation";

import { PaymentReservationProvider } from "../providers/PaymentReservationProvider";

@nest.Controller("reservations")
export class PaymentReservationsController
{
    @helper.EncryptedRoute.Patch("get")
    public async get
        (
            @helper.EncryptedBody() input: IPaymentSource.IAccessor
        ): Promise<IPaymentReservation>
    {
        assertType<typeof input>(input);

        const reservation: PaymentReservation = await PaymentReservation.findOneOrFail({
            source_schema: input.schema,
            source_table: input.table,
            source_id: input.id
        });
        if (await reservation.password.equals(input.password) === false)
            throw new nest.ForbiddenException("Wrong password.");

        return await PaymentReservationProvider.json().getOne(reservation);
    }

    @helper.EncryptedRoute.Patch(":id")
    public async at
        (
            @helper.TypedParam("id", "string") id: string,
            @helper.EncryptedBody() input: IPaymentSource.IPassword
        ): Promise<IPaymentReservation>
    {
        assertType<typeof input>(input);
        
        const reservation: PaymentReservation = await PaymentReservation.findOneOrFail(id);
        if (await reservation.password.equals(input.password) === false)
            throw new nest.ForbiddenException("Wrong password.");

        return await PaymentReservationProvider.json().getOne(reservation);
    }

    @helper.EncryptedRoute.Post()
    public async store
        (
            @helper.EncryptedBody() input: IPaymentReservation.IStore
        ): Promise<IPaymentReservation>
    {
        assertType<typeof input>(input);

        const collection: safe.InsertCollection = new safe.InsertCollection();
        const reservation: PaymentReservation = await PaymentReservationProvider.collect
        (
            collection,
            input
        );
        await collection.execute();
        return await PaymentReservationProvider.json().getOne(reservation);
    }
}