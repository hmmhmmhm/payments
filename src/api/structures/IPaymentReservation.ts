import { IIamportSubscription } from "iamport-server-api/lib/structures/IIamportSubscription";
import { ITossBilling } from "toss-payments-server-api/lib/structures/ITossBilling";

import { IPaymentSource } from "./IPaymentSource";
import { IPaymentVendor } from "./IPaymentVendor";

export type IPaymentReservation = IPaymentReservation.IamportType | IPaymentReservation.TossType;
export namespace IPaymentReservation
{
    export type IamportType = BaseType<"iamport", IIamportSubscription>;
    export type TossType = BaseType<"toss.payments", ITossBilling>;

    export interface BaseType<
        VendorCode extends IPaymentVendor.Code,
        Data extends object>
    {
        /**
         * Primary Key.
         */
        id: string;

        vendor_code: VendorCode;

        /**
         * 벤더사.
         */
        vendor: IPaymentVendor<VendorCode>;
    
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
        data: Data;
    
        /**
         * 레코드 생성 일시.
         */
        created_at: string;
    }

    export interface IStore
    {
        /**
         * 벤더사 정보.
         */
        vendor: IPaymentVendor<IPaymentVendor.Code>;

        /**
         * 원천 레코드 정보.
         */
        source: IPaymentSource;

        /**
         * 제목
         */
        title: string;

        /**
         * 간편결제 비밀번호.
         * 
         * 주의할 점은 카드 비밀번호가 아니라는 것.
         */
        password: string;
    }
}