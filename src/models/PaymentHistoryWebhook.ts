/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import safe from "safe-typeorm";
import * as orm from "typeorm";

import { PaymentHistory } from "./PaymentHistory";
import { PaymentHistoryWebhookResponse } from "./PaymentHistoryWebhookResponse";

@orm.Entity()
export class PaymentHistoryWebhook
    extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(() => PaymentHistory,
        "uuid",
        "payment_history_id",
        { index: true }
    )
    public readonly history!: safe.Belongs.ManyToOne<PaymentHistory, "uuid">;

    @safe.EncryptedColumn("longtext", {
        password: () => PaymentHistoryWebhook.ENCRYPTION_PASSWORD
    })
    public readonly previous!: string;

    @safe.EncryptedColumn("longtext", {
        password: () => PaymentHistoryWebhook.ENCRYPTION_PASSWORD
    })
    public readonly current!: string;

    @safe.EncryptedColumn("longtext", {
        password: () => PaymentHistoryWebhook.ENCRYPTION_PASSWORD
    })
    public readonly data!: string;

    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany
    (
        () => PaymentHistoryWebhookResponse,
        response => response.webhook,
        (x, y) => x.created_at.getTime() - y.created_at.getTime()
    )
    public readonly responses!: safe.Has.OneToMany<PaymentHistoryWebhookResponse>;
}
export namespace PaymentHistoryWebhook
{
    export const ENCRYPTION_PASSWORD = 
    {
        key: "f14Yssrh4IFsnfsf1u3VNkc2uozlIeYr",
        iv: "BDULhiDJoTHAxLGo"
    };
}