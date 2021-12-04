/**
 * @packageDocumentation
 * @module models.tables.payments
 */
//================================================================
import * as orm from "typeorm";
import safe from "safe-typeorm";

@orm.Unique(["vendor_code", "vendor_uid"])
@orm.Unique(["source_schema", "source_table", "source_id"])
export class PaymentBase
    extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @orm.Column("varchar")
    public readonly vendor_code!: "iamport" | "toss.payments";

    @orm.Column("varchar")
    public readonly vendor_store_id!: string;

    @orm.Column("varchar")
    public readonly vendor_uid!: string;

    @orm.Column("varchar")
    public readonly source_schema!: string;

    @orm.Column("varchar")
    public readonly source_table!: string;

    @orm.Column("varchar")
    public readonly source_id!: string;

    @orm.Column(()  => safe.Password)
    public readonly password = new safe.Password();

    @orm.Index()
    @orm.CreateDateColumn()
    public readonly created_at!: Date;
}