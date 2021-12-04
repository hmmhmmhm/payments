import { v4 } from "uuid";

import imp from "iamport-server-api";
import payments from "../../../../api";
import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { IIamportResponse } from "iamport-server-api/lib/structures/IIamportResponse";
import { IPaymentHistory } from "../../../../api/structures/IPaymentHistory";

import { IamportAsset } from "../../../../services/iamport/IamportAsset";

export async function test_fake_iamport_payment_history
    (connection: payments.IConnection): Promise<void>
{
    //----
    // 결제의 원천이 되는 주문 정보
    //----
    /**
     * 귀하의 백엔드 서버가 발행한 주문 ID.
     */
    const yourOrderId: string = v4();

    /**
     * 주문 금액.
     */
    const yourOrderPrice: number = 12_000;

    /* -----------------------------------------------------------
        결제 내역 등록
    ----------------------------------------------------------- */
    const payment: IIamportResponse<IIamportPayment> = 
        await imp.functional.subscribe.payments.onetime
        (
            await IamportAsset.connection("test-iamport-store-id"),
            {
                card_number: "1234-1234-1234-1234",
                expiry: "2028-12",
                birth: "880311",

                merchant_uid: yourOrderId,
                amount: yourOrderPrice,
                name: "Fake 주문"
            }
        );
    
    const history: IPaymentHistory = await payments.functional.histories.store
    (
        connection,
        {
            vendor: {
                code: "iamport",
                store_id: "test-iamport-store-id",
                uid: payment.response.imp_uid,
            },
            source: {
                schema: "some-schema",
                table: "some-table",
                id: yourOrderId
            },
            webhook_url: "https://github.com/samchon",
            price: yourOrderPrice,
            password: "some-password",
        }
    );

    /* -----------------------------------------------------------
        결제 내역 조회하기
    ----------------------------------------------------------- */
    /**
     * 결제 내역 조회하기 by {@link IPaymentHistory.id}.
     * 
     * 앞서 등록한 결제 이력의 상세 정보를 {@link IPaymentHistory.id} 를 이용하여 조회할
     * 수 있다. 하지만, 이 때 앞서 결제 이력을 등록할 때 사용했던 비밀번호가 필요하니, 부디
     * 귀하의 백엔드 서버에서 이를 저장하였기 바란다.
     */ 
    const read: IPaymentHistory = await payments.functional.histories.at
    (
        connection,
        history.id,
        {
            password: "some-password"
        }
    );
    if (read.vendor_code === "iamport")
        read.data.imp_uid;

    /**
     * 결제 내역 조회하기 by {@link IPaymentSource}.
     * 
     * 앞서 등록한 결제 이력의 상세 정보는 {@link IPaymentSource} 를 통하여도 조회할 수
     * 있다. 다만, 이 때 앞서 결제 이력을 등록할 때 사용했던 비밀번호가 필요하니, 부디
     * 귀하의 백엔드 서버에서 이를 저장하였기 바란다.
     */
    const gotten: IPaymentHistory = await payments.functional.histories.get
    (
        connection,
        {
            schema: "some-schema",
            table: "some-table",
            id: yourOrderId,
            password: "some-password"
        }
    );
    if (gotten.vendor_code === "iamport")
        gotten.data.imp_uid;
}