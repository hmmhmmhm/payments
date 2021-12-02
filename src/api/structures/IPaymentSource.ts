export interface IPaymentSource
{
    /**
     * DB 스키마 이름
     */
    schema: string;

    /**
     * DB 테이블 명
     */
    table: string;

    /**
     * 레코드의 PK
     */
    id: string;
}
export namespace IPaymentSource
{
    export interface IAccessor
        extends IPaymentSource,
            IPassword
    {
    }

    export interface IPassword
    {
        password: string;
    }
}