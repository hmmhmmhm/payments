export interface IPaymentVendor<Code extends IPaymentVendor.Code>
{
    /**
     * 벤더사 코드.
     */
    code: Code;

    /**
     * 벤더사가 전달해준 주문 식별자 번호
     */
    uid: string;

    /**
     * PG 사들은 사이트 주소가 다르면, 다른 계정을 신청해 사용하라고 함.
     * 
     * 그리고 아키드로우는 여러 사이트를 운영하니, 필연적으로 PG 사 계정이 여러 개이다.
     * 
     * 때문에 자신이 사용하는 사이트에 알맞는 PG 사의 스토어 ID 를 입력해 줄 것.
     */
    store_id: string;
}
export namespace IPaymentVendor
{
    export type Code = "iamport" | "toss.payments";
}