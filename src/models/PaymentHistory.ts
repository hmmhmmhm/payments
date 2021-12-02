/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import * as orm from "typeorm"

import { PaymentBase } from "./internal/PaymentBase";

@orm.Entity()
export class PaymentHistory
    extends PaymentBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.Column("varchar", { length: 1024 })
    public readonly webhook_url!: string;

    @orm.Column("varchar")
    public readonly currency_unit!: string;

    @orm.Column("double")
    public readonly price!: number;

    @orm.Column("datetime", { nullable: true })
    public readonly paid_at!: Date | null;

    @orm.Column("datetime", { nullable: true })
    public readonly cancelled_at!: Date | null;
}