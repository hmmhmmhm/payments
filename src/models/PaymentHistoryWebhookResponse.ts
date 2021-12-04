/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import safe from "safe-typeorm";
import * as orm from "typeorm";

import { PaymentHistoryWebhook } from "./PaymentHistoryWebhook";

@orm.Entity()
export class PaymentHistoryWebhookResponse 
    extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(() => PaymentHistoryWebhook,
        "uuid",
        "payment_history_webhook_id",
        { index: true }
    )
    public readonly webhook!: safe.Belongs.ManyToOne<PaymentHistoryWebhook, "uuid">;

    @orm.Column("int", { nullable: true })
    public readonly status!: number | null;

    @orm.Column("longtext", { nullable: true })
    public readonly body!: string | null;

    @orm.CreateDateColumn()
    public readonly created_at!: Date;
}