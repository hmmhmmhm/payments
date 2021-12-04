/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import * as orm from "typeorm";
import safe from "safe-typeorm";

import { PaymentBase } from "./internal/PaymentBase";

@orm.Entity()
export class PaymentReservation
    extends PaymentBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.Column("varchar")
    public readonly title!: string;

    @safe.EncryptedColumn("longtext", {
        password: () => PaymentReservation.ENCRYPTION_PASSWORD
    })
    public readonly data!: string;
}
export namespace PaymentReservation
{
    export const ENCRYPTION_PASSWORD = {
        key: "ctUkesGYNV4yhpSvKANdsZcms5oJuoZM",
        iv: "DuOBreMcJL4H0WXj"
    };
}