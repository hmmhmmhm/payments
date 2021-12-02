import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { ITossPayment } from "toss-payments-server-api/lib/structures/ITossPayment";

import { IPaymentSource } from "./IPaymentSource";
import { IPaymentVendor } from "./IPaymentVendor";

export type IPaymentHistory 
    = IPaymentHistory.IamportType 
    | IPaymentHistory.TossType;

export namespace IPaymentHistory
{
    /**
     * 결제 입력 정보.
     * 
     * SDK 에서 받은 데이터를 취합하여 결제 진행 상황을 서버에 알려준다. 
     */
    export interface IStore
    {
        /**
         * 벤더사 정보
         */
        vendor: IPaymentVendor<"iamport" | "toss.payments">;

        /**
         * 결제의 근간이 된 원천 레코드 정보.
         */
        source: IPaymentSource;

        /**
         * 결제 정보가 갱신되었을 때, 이를 수신할 URL
         */
        webhook_url: string;

        /**
         * 결제되어야 할 총액.
         * 
         * 실 결제금액과 비교하여 이와 다를 시, 422 에러가 리턴됨.
         */
        price: number;

        /**
         * 레코드 열람에 사용할 비밀번호 설정.
         */
        password: string;
    }

    export interface BaseType<
            VendorCode extends IPaymentVendor.Code, 
            Data extends object>
    {
        /**
         * Primary Key.
         */
        id: string;

        /**
         * 벤더사 식별자 코드.
         * 
         * {@link IPaymentVendor.code}와 완전히 동일한 값이되, 단지 union type 
         * specialization 을 위해 중복 표기하였을 뿐이다. If else condition 을 통하여
         * {@link IPaymentHistory.data}의 타입을 특정할 수 있다.
         */
        vendor_code: VendorCode;

        /**
         * 벤더 정보.
         */
        vendor: IPaymentVendor<VendorCode>;

        /**
         * 원천 래코드 정보.
         */
        source: IPaymentSource;

        /**
         * 결제 상세 데이터, 벤더별로 데이터 양식이 다르니 주의할 것.
         */
        data: Data;

        /**
         * 결제 정보가 갱신되었을 때, 이를 수신할 URL
         */
        webhook_url: string | null;

        /**
         * 통화 단위
         * 
         * KRW, USB, JPY 등.
         */
        currency_unit: string;

        /**
         * 결제 가격.
         */
        price: number;

        /**
         * 결제 레코드 생성 일시.
         */
        created_at: string;

        /**
         * 결제 완료 일시.
         */
        paid_at: string | null;

        /**
         * 결제 취소 일시.
         */
        cancelled_at: string | null;
    }
    export type IamportType = BaseType<"iamport", IIamportPayment>;
    export type TossType = BaseType<"toss.payments", ITossPayment>;

    /**
     * @internal
     */
    export interface IProps
    {
        currency_unit: string;
        price: number;
        paid_at: Date | null;
        cancelled_at: Date | null;
    }
}