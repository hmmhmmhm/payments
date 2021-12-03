/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import * as orm from "typeorm";

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
}