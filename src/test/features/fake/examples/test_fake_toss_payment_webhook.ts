import { sleep_for } from "tstl/thread/global";
import { v4 } from "uuid";

import toss from "toss-payments-server-api";
import payments from "../../../../api";
import { IPaymentHistory } from "../../../../api/structures/IPaymentHistory";
import { IPaymentWebhook } from "../../../../api/structures/IPaymentWebhook";
import { ITossPayment } from "toss-payments-server-api/lib/structures/ITossPayment";

import { FakePaymentStorage } from "../../../../providers/FakePaymentStorage";
import { PaymentConfiguration } from "../../../../PaymentConfiguration";
import { TossAsset } from "../../../../services/toss/TossAsset";

export async function test_fake_toss_payment_webhook
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
    const yourOrderPrice: number = 25_000;

    /* -----------------------------------------------------------
        결제 내역 등록
    ----------------------------------------------------------- */
    /**
     * 토스 페이먼츠 시뮬레이션.
     * 
     * 고객이 프론트 어플리케이션에서, 토스 페이먼츠가 제공하는 팝업 창을 이용, 가상 계좌
     * 결제를 하는 상황을 시뮬레이션 한다. 고객이 가상 계좌 발급을 마치거든, 프론트
     * 어플리케이션에 {@link ITossPayment.paymentKey} 가 전달된다.
     * 
     * 이 {@link ITossPayment.paymentKey} 와 귀하의 백엔드에서 직접 생성한 
     * {@link ITossPayment.orderId yourOrderId} 를 잘 기억해두었다가, 이를 다음 단계인
     * {@link IPaymentHistory} 등록에 사용하도록 하자.
     */
    const payment: ITossPayment = await toss.functional.v1.virtual_accounts.store
    (
        TossAsset.connection("test-toss-store-id"),
        {
            // 가싱 계좌 정보
            method: "virtual-account",
            bank: "신한",
            customerName: "남정호",

            // 주문 정보
            orderId: yourOrderId,
            orderName: "some-order-name",
            amount: 25_000,

            // 고의 미승인 처리
            __approved: false
        }
    );

    /**
     * 웹훅 URL 설정하기.
     * 
     * 웹훅 URL 을 테스트용 API 주소, internal.webhook 으로 설정.
     */
    const webhook_url: string = "http://127.0.0.1:"
        + PaymentConfiguration.API_PORT
        + payments.functional.internal.webhook.PATH;
    
    /**
     * 결제 이력 등록하기.
     * 
     * 앞서 토스 페이먼츠의 팝업 창을 이용하여 가상 계좌 결제를 진행하고 발급받은
     * {@link ITossPayment.paymentKey}, 그리고 귀하의 백엔드에서 직접 생성한
     * {@link ITossPayment.orderId yourOrderId} 를 각각 {@link IPaymentVendor.uid} 와
     * {@link IPaymentSource.id} 로 할당하여 {@link IPaymentReservation} 레코드를 
     * 발행한다.
     * 
     * 참고로 결제 이력을 등록할 때 반드시 비밀번호를 설정해야 하는데, 향후 결제 이력을
     * 조회할 때 필요하니, 이를 반드시 귀하의 백엔드 서버에 저장해두도록 한다.
     */
    const history: IPaymentHistory = await payments.functional.histories.store
    (
        connection,
        {
            vendor: {
                code: "toss.payments",
                store_id: "test-toss-store-id",
                uid: payment.paymentKey,
            },
            source: {
                schema: "some-schema",
                table: "some-table",
                id: yourOrderId
            },
            webhook_url, // 테스트용 웹훅 URL
            price: yourOrderPrice,
            password: "some-password",
        }
    );

    /* -----------------------------------------------------------
        웹훅 이벤트 리스닝
    ----------------------------------------------------------- */
    /**
     * 입금 시뮬레이션하기.
     * 
     * 고객이 자신 앞을 발급된 계좌에, 결제 금액을 입금하는 상황 시뮬레이션.
     */
    await toss.functional.internal.deposit
    (
        TossAsset.connection("test-toss-store-id"),
        payment.paymentKey
    );

    // 웹훅 이벤트가 귀하의 백엔드 서버로 전달되기를 기다림.
    await sleep_for(100);

    /**
     * 웹흑 리스닝 시뮬레이션.
     * 
     * 귀하의 백엔드 서버가 웹훅 이벤트를 수신한 상황을 가정한다.
     */
    const webhook: IPaymentWebhook = FakePaymentStorage.webhooks.back();    
    if (webhook.current.id !== history.id)
        throw new Error("Bug on PaymentWebhooksController.toss(): failed to deliver the webhook event.");
    else if (webhook.previous.paid_at !== null)
        throw new Error("Bug on PaymentWebhookProvider.process(): failed to delivery the exact previous data.");
    else if (webhook.current.paid_at === null)
        throw new Error("Bug on PaymentWebhookProvider.process(): failed to delivery the exact current data.");

    // 웹훅 데이터 삭제
    FakePaymentStorage.webhooks.pop_back();
}