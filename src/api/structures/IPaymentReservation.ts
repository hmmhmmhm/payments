import { ITossBilling } from "toss-payments-server-api/lib/structures/ITossBilling";

import { IPaymentSource } from "./IPaymentSource";
import { IPaymentVendor } from "./IPaymentVendor";

export interface IPaymentReservation
{
    /**
     * Primary Key.
     */
    id: string;

    /**
     * 벤더사.
     */
    vendor: IPaymentVendor<"toss.payments">;

    /**
     * 대상 액터의 참조 정보.
     */
    source: IPaymentSource;

    /**
     * 제목.
     */
    title: string;

    /**
     * 벤더사 데이터.
     */
    data: ITossBilling;

    /**
     * 레코드 생성 일시.
     */
    created_at: string;
}
export namespace IPaymentReservation
{
    export interface IStore
    {
        /**
         * 벤더사.
         */
        vendor: IPaymentVendor<"toss.payments">;

        /**
         * 대상 액터의 참조 정보.
         */
        source: IPaymentSource;

        /**
         * 제목
         */
        title: string;

        /**
         * 저장할 결제 정보.
         * 
         * 현재는 토스 페이먼츠만 사용하니, 토스 페이먼츠에 기록할 고객의 카드 정보.
         */
        data: Omit<ITossBilling.IAccessor, "customerKey">;

        /**
         * 간편결제 비밀번호.
         * 
         * 주의할 점은 카드 비밀번호가 아니라는 것.
         */
        password: string;
    }
}