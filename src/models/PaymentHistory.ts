/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import safe from "safe-typeorm";
import * as orm from "typeorm"

import { PaymentBase } from "./internal/PaymentBase";
import { PaymentHistoryWebhook } from "./PaymentHistoryWebhook";

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

    @safe.EncryptedColumn("longtext", {
        password: () => PaymentHistory.ENCRYPTION_PASSWORD
    })
    public readonly data!: string;

    @orm.Column("datetime", { nullable: true })
    public readonly paid_at!: Date | null;

    @orm.Column("datetime", { nullable: true })
    public readonly cancelled_at!: Date | null;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany
    (
        () => PaymentHistoryWebhook,
        webhook => webhook.history,
        (x, y) => x.created_at.getTime() - y.created_at.getTime()
    )
    public readonly webhooks!: safe.Has.OneToMany<PaymentHistoryWebhook>;
}
export namespace PaymentHistory
{
    export const ENCRYPTION_PASSWORD = 
    {
        key: "GGP9ysJ8y8GTzhrUNktqYBuLOr3ruXif",
        iv: "UOavENJrVsrb7Vmr"
    };
}