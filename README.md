# Payments Server
## 1. Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/payments/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/payments-api.svg)](https://www.npmjs.com/package/payments-api)
[![Downloads](https://img.shields.io/npm/dm/payments-api.svg)](https://www.npmjs.com/package/payments-api)
[![Build Status](https://github.com/samchon/payments/workflows/build/badge.svg)](https://github.com/samchon/payments/actions?query=workflow%3Abuild)

`payments-server` 는 통합 결제 서버를 구현한 프로젝트이다. 

여기서 말하는 통합 결제란, [아임포트](https://github.com/samchon/fake-iamport-server)나 [토스 페이먼츠](https://github.com/samchon/fake-toss-payments-server) 등, 여러 PG 사들을 일괄 관리할 수 있다는 뜻이다. 더하여 `payments-server` 는 MSA (Micro Service Architecture) 를 고려하여 설계된 프로젝트로써, 귀하의 서비스 중 결제 부문만을 따로이 분리하여 관리할 수 있다.

또한 `payments-server` 가 연동하게 되는 결제 PG 사들은 본디 프론트 어플리케이션과 연동한 수기 테스트가 필요하다. 이 때문에 이들 결제 PG 사들과 연동해야 하는 결제 서버들은, 테스트 자동화 프로그램을 작성할 수 없기에, 필연적으로 테스트 커버리지가 낮아 매우 불안정해진다. 하지만 `payments-server` 는 결제 PG 사들의 API 를 흉내낸 가짜 PG 서버들을 구현, 이들을 통하여 테스트 자동화 프로그램을 구성함으로써 안정성을 담보한다.

  - [samchon/fake-iamport-server](https://github.com/samchon/fake-iamport-server)
  - [samchon/fake-toss-payments-server](https://github.com/samchon/fake-toss-payments-server)

마지막으로 `payments-server` 는 [payments-api](https://www.npmjs.com/package/payments-api) 라 하여, 통합 결제 서버와 연동할 수 있는 SDK 라이브러리를 제공한다. 귀하는 이 [payments-api](https://www.npmjs.com/package/payments-api) 를 통하여, 통합 결제 서버와 매우 손쉽게 연동할 수 있고, 이를 통하여 결제 부문에 관련된 MSA (Micro Service Architecture) 를 매우 안전하게 구성할 수 있다.

  - 자료구조 매뉴얼: [src/api/structures/IPaymentHistory.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/structures/IPaymentHistory.ts)
  - API 함수 매뉴얼: [src/api/functional/histories/index.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/functional/histories/index.ts)
  - 예제 코드
    - 아임포트
      - 결제 기록하기: [test_fake_iamport_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_iamport_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_iamport_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/)
    - 토스 페이먼츠
      - 결제 기록하기: [test_fake_toss_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_toss_payment_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_toss_payment_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_webhook.ts)

```typescript
import { v4 } from "uuid";

import imp from "iamport-server-api";
import payments from "payments-api";
import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { IIamportResponse } from "iamport-server-api/lib/structures/IIamportResponse";
import { IPaymentHistory } from "payments-api/lib/structures/IPaymentHistory";

import { IamportAsset } from "../../../../services/iamport/IamportAsset";

export async function test_fake_iamport_payment_history
    (connection: payments.IConnection): Promise<IIamportPayment>
{
    // 주문 정보
    const yourOrderId: string = v4(); // 귀하의 백엔드 서버가 발행한 주문 ID
    const yourOrderPrice: number = 12_000; // 주문 금액

    // 아임포트 카드 결제 시뮬레이션
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
    
    // 결제 이력 등록하기
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

    // 결제 내역 조회하기
    const read: IPaymentHistory = await payments.functional.histories.at
    (
        connection,
        history.id,
        {
            password: "some-password"
        }
    );

    // if condition 을 이용한 자동 다운 캐스팅
    if (read.vendor_code === "iamport")
        read.data.imp_uid;
    return read.data;
}
```




## 2. Installation
### 2.1. NodeJS
본 서버 프로그램은 TypeScript 로 만들어졌으며, NodeJS 에서 구동된다. 

고로 제일 먼저 할 일은, NodeJS 를 설치하는 것이다. 아래 링크를 열어, NodeJS 프로그램을 다운로드 받은 후 즉각 설치하기 바란다. 참고로 NodeJS 버전은 어지간히 낮은 옛 시대의 버전만 아니면 되니, 구태여 latest 버전을 설치할 필요는 없으며, stable 버전만으로도 충분하다.

  - https://nodejs.org/en/

### 2.2. MariaDB
본 서버는 MariaDB 를 사용하고 있다. 따라서 로컬에서 백엔드 서버를 개발하고 구동하려거든, MySQL DB 가 반드시 설치되어있어야 한다. 아래 링크에서 설치 마법사를 다운로드하여, MariaDB 10.5.8 버전을 설치할 것.

  - https://downloads.mariadb.org/mariadb/10.5.8/

사용자 아이디와 암호는 모두 `root` 로 설정해준다. 그리고 MariaDB 터미널로 접속하여 아래 SQL 구문을 입력함으로써, `payments` 스키마를 새로 생성해준다. 참고로 MariaDB 는 기본 캐릭터셋이 `utf8` 이 아닌 `latin1` 이다. 따라서 아래 SQL 구문을 실행할 때, 뒷쪽의 `CHARATER SET` 구문을 빠트리는 일이 없도록 한다.

> ```bash
> sudo mysqladmin -u root password 'root'
> ```

그리고 로컬 DB 의 `SQL_MODE` 를 `ONLY_FULL_GROUP_BY` 으로 설정할 것이다. `ONLY_FULL_GROUP_BY` 이란, GROUP BY 를 사용한 SQL Select 구문에서 집계 함수를 사용하지 아니한 필드가 있거든 Syntax Error 가 나도록 하는 설정이다. 로컬 개발 중에 잘못된 SQL 집계문 사용을 방지하기 위하여, 엄격한 문법 검사 모드로 MariaDB 로컬 DB 를 운용하기 위함이다.

```sql
CREATE SCHEMA payments
    DEFAULT CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
SET GLOBAL sql_mode = 'ANSI,TRADITIONAL';
```

### 2.3. Server
NodeJS 및 MariaDB 의 설치가 끝났다면, 바로 `payments-server` 구동을 시작할 수 있다. 

제일 먼저 `git clone` 을 통하여, 결제 서버 프로젝트를 로컬 저장소에 복사하도록 한다. 그리고 해당 폴더로 이동하여 `npm install` 명령어를 실행함으로써, 통합 결제 서버를 구동하는 데 필요한 라이브러리들을 다운로드 한다. 그리고 `npm run build` 명령어를 입력하여, 결제 서버의 소스 코드를 컴파일한다. 마지막으로 `npm run start` 명령어를 실행해주면, 결제 서버가 구동된다. 

다만 `payments-server` 를 구동하기 전, 각각 [PaymentConfiguration](https://github.surf/samchon/payments/blob/HEAD/src/PaymentConfiguration.ts) 과 [PaymentGlobal](https://github.surf/samchon/payments/blob/HEAD/src/PaymentGlobal.ts) 클래스에 어떠한 속성들이 있는지 꼼꼼히 읽어보고, 귀하의 서비스에 알맞는 설정을 해 주도록 한다.

```bash
# CLONE REPOSITORY
git clone https://github.com/samchon/payments
cd payments

# INSTALLATION & COMPILATION
npm install
npm run build

# START SERVER & STOP SERVER
npm run start
npm run stop
```

[![npm version](https://badge.fury.io/js/payments-server.svg)](https://www.npmjs.com/package/payments-server)
[![Downloads](https://img.shields.io/npm/dm/payments-server.svg)](https://www.npmjs.com/package/payments-server)

더하여 `payments-server` 는 npm 모듈로 설치하여 `import` 할 수 있다.

이러한 방식은 `payments-server` 와 연동하는 백엔드 서버를 개발할 때 특히 유용하다. 해당 백엔드 서버의 안정성을 상시 보증하기 위하여 테스트 자동화 프로그램을 개발할 때, 테스트 자동화 프로그램에서 `paments-server` 의 설정과 개설 및 폐쇄를 완전히 통제할 수 있기 때문이다.

따라서 귀하의 백엔드 서버가 TypeScript 내지 JavaScript 를 사용한다면, 테스트 자동화 프로그램을 구성함에 있어 github 저장소를 clone 하고 `payments-server` 를 별도 구동하기보다, 귀하의 백엔드 서버 테스트 프로그램에서 `payments-server` 모듈을 `import` 후 그것의 개설과 폐쇄를 직접 통제하는 것을 권장한다.

그리고 이렇게 테스트 자동화 프로그램으로 `payments-server` 를 `import` 하여 사용할 때 역시, 각각 [PaymentConfiguration](https://github.surf/samchon/payments/blob/HEAD/src/PaymentConfiguration.ts) 과 [PaymentGlobal](https://github.surf/samchon/payments/blob/HEAD/src/PaymentGlobal.ts) 클래스에 어떠한 속성들이 있는지 꼼꼼히 읽어보고, 귀하의 서비스에 알맞는 설정을 해 주도록 한다.

```typescript
// npm install --save-dev payments-server
import payments from "payments-server";

async function main(): Promise<void>
{
    // CONFIGURATION
    payments.PaymentGlobal.mode = "LOCAL";
    payments.PaymentGlobal.testing = true;
    payments.PaymentConfiguration.ENCRYPTION_PASSWORD = {
        key: "SqwHmmXm1fZteI3URPtoyBWFJDMQ7FBQ",
        iv: "9eSfjygAClnE1JJs"
    };

    // BACKEND OPENING
    const backend: payments.PaymentBackend = new payments.PaymentBackend();
    await backend.open();
    await backend.close();
}
```

### 2.4. SDK
[![npm version](https://badge.fury.io/js/payments-api.svg)](https://www.npmjs.com/package/payments-api)
[![Downloads](https://img.shields.io/npm/dm/payments-api.svg)](https://www.npmjs.com/package/payments-api)

본 프로젝트 `payments-server` 는 SDK 라이브러리를 제공한다.

귀하는 이 `payments-api` 를 통하여, 통합 결제 서버와 매우 손쉽게 연동할 수 있고, 이를 통하여 결제 부문에 관련된 MSA (Micro Service Architecture) 를 매우 안전하게 구성할 수 있다. 

`npm install --save payments-api` 명령어를 통하여 통합 결제와의 연동을 위한 SDK 라이브러리를 설치한 후, 아래 매뉴얼 및 예제 코드를 참고하여 귀하의 백엔드 서비스가 필요로 하는 결제 기능을 개발하도록 한다.

  - 자료구조 매뉴얼: [src/api/structures/IPaymentHistory.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/structures/IPaymentHistory.ts)
  - API 함수 매뉴얼: [src/api/functional/histories/index.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/functional/histories/index.ts)
  - 예제 코드
    - 아임포트
      - 결제 기록하기: [test_fake_iamport_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_iamport_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_iamport_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/)
    - 토스 페이먼츠
      - 결제 기록하기: [test_fake_toss_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_toss_payment_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_toss_payment_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_webhook.ts)

```typescript
import { v4 } from "uuid";

import payments from "payments-api";
import toss from "toss-payments-server-api";
import { IPaymentReservation } from "payments-api/lib/structures/IPaymentReservation";
import { ITossBilling } from "toss-payments-server-api/lib/structures/ITossBilling";

import { TossAsset } from "../../../../services/toss/TossAsset";

export async function test_fake_toss_payment_reservation
    (connection: payments.IConnection): Promise<ITossBilling>
{
    const yourSourceId: string = v4(); // 귀하의 백엔드 서버가 발행한 식별자 ID.

    // 토스 페이먼츠 간편 결제 카드 등록 시뮬레이션
    const billing: ITossBilling = 
        await toss.functional.v1.billing.authorizations.card.store
        (
            TossAsset.connection("test-toss-store-id"),
            {
                customerKey: yourSourceId,
                cardNumber: "1111222233334444",
                cardExpirationYear: "28",
                cardExpirationMonth: "03",
                cardPassword: "99",
                customerBirthday: "880311",
                consumerName: "남정호"
            }
        );

    // 간편 결제 수단 등록하기
    const reservation: IPaymentReservation = 
        await payments.functional.reservations.store
        (
            connection,
            {
                vendor: {
                    code: "toss.payments",
                    store_id: "test-toss-store-id",
                    uid: billing.billingKey,
                },
                source: {
                    schema: "some-schema",
                    table: "some-table",
                    id: yourSourceId,
                },
                title: "some-title",
                password: "some-password"
            }
        );

    // 간편 결제 등록 수단 조회하기
    const read: IPaymentReservation = await payments.functional.reservations.at
    (
        connection,
        reservation.id,
        {
            password: "some-password"
        }
    );

    // if condition 을 이용한 자동 다운 캐스팅
    if (read.vendor_code === "toss.payments")
        read.data.billingKey;
    return read.data;
}
```




## 3. Development
### 3.1. Definition
백엔드 서버에 새 API 를 추가하고 기능을 변경하는 일 따위는 물론, API 컨트롤러, 즉 [src/controllers](src/controllers) 의 코드를 수정함으로써 이루어진다. 하지만 `payments-server` 는 신규 API 가 필요하거나 혹은 기존 API 의 변경 필요할 때, 대뜸 [Main Program](#33-main-program) 의 코드부터 작성하고 보는 것을 매우 지양한다. 그 대신 `payments-server` 는 API 의 인터페이스만을 먼저 정의하고, [Main Program](#33-main-program) 의 구현은 나중으로 미루는 것을 지향한다.

따라서 `payments-server` 에 새 API 를 추가하려거든, [src/controllers](src/controllers) 에 새 API 의 인터페이스만을 먼저 정의해준다. 곧이어 `npm run build:api` 명령어를 통하여, API Library 를 빌드한다. 경우에 따라서는 서비스 서버와의 동시 개발을 위하여, 새로이 빌드된 SDK 를 그대로 `npm run package:api` 해 버려도 좋다. 

이후 로컬에서 새로이 생성된 SDK 와 해당 API 를 이용, 유즈케이스 시나리오를 테스트 자동화 프로그램으로 작성한다. 이후 Main Program 을 제작하며, 앞서 작성해 둔 테스트 자동화 프로그램으로 상시 검증한다. 마지막으로 Main Program 까지 완성되면 이를 배포하면 된다.

이하 `payments-server` 의 개략적인 개발 순서를 요약하면 아래와 같다.

  - API Interface Definition
  - API Library (SDK) 빌드
  - Test Automation Program 제작
  - Main Program 제작 및 테스트 자동화 프로그램을 이용한 상시 검증
  - DEV 및 REAL 서버에 배포

### 3.2. Test Automation Program
```bash
npm run test
```

새로이 개발할 [API 인터페이스 정의](#31-api-interface-definition)를 마쳤다면, 그 다음에 할 일은 바로 해당 API 에 대한 유즈케이스 시나리오를 세우고 이를 테스트 자동화 프로그램을 만들어, 향후 [Main Program](#33-main-program) 제작시 이를 상시 검증할 수 있는 수단을 구비해두는 것이다 - TDD (Test Driven Development).

그리고 본 프로젝트는 `npm run test` 라는 명령어를 통하여, 서버 프로그램의 일체 기능 및 정책 등에 대하여 검증할 수 있는, 테스트 자동화 프로그램을 구동해 볼 수 있다. 더불어 테스트 자동화 프로그램은 순수하게 `payments-server` 의 메인 서버 프로그램 뿐 아니라, 통합 결제 서버와 연동하는 다양한 외부 PG 사 시스템들도, 가상으로 구동하게 된다.

  - [fake-iamport-payments-server](https://github.com/samchon/fake-iamport-payments-server)
  - [fake-toss-payments-server](https://github.com/samchon/fake-toss-payments-server)

그리고 만약 새 테스트 로직을 추가하고 싶다면, [src/test/features](src/test/features) 내 적당한 위치에 새 `ts` 파일을 하나 만들고, `test_` 로 시작하는 함수를 하나 만들어 그 안에 테스트 로직을 작성한 후, 이를 `export` 심벌을 이용하여 배출해주면 된다. 이에 대한 자세한 내용은 [src/test/features](src/test/features) 폴더에 들어있는 모든 `ts` 파일 하나 하나가 다 좋은 예제 격이니, 이를 참고하도록 한다.

```typescript
import { v4 } from "uuid";
import { sleep_for } from "tstl/thread/global";

import imp from "iamport-server-api";
import payments from "../../../../api";
import { IIamportPayment } from "iamport-server-api/lib/structures/IIamportPayment";
import { IIamportResponse } from "iamport-server-api/lib/structures/IIamportResponse";
import { IPaymentHistory } from "../../../../api/structures/IPaymentHistory";
import { IPaymentWebhook } from "../../../../api/structures/IPaymentWebhook";

import { FakePaymentStorage } from "../../../../providers/FakePaymentStorage";
import { IamportAsset } from "../../../../services/iamport/IamportAsset";
import { PaymentConfiguration } from "../../../../PaymentConfiguration";

export async function test_fake_iamport_payment_webhook
    (connection: payments.IConnection): Promise<void>
{
     const yourOrderId: string = v4(); // 귀하의 서비스가 발행한 주문 ID.
     const yourOrderPrice: number = 19_900; // 주문 금액

    // 아임포트 가상 계좌 결제 시뮬레이션
    const payment: IIamportResponse<IIamportPayment> = 
        await imp.functional.vbanks.store
        (
            await IamportAsset.connection("test-iamport-store-id"),
            {
                merchant_uid: yourOrderId,
                amount: yourOrderPrice,
                vbank_code: "SHINHAN",
                vbank_due: Date.now() / 1_000 + 7 * 24 * 60 * 60,
                vbank_holder: "남정호"
            }
        );

    // 웹훅 URL 설정하기.
    const webhook_url: string = "http://127.0.0.1:"
        + PaymentConfiguration.API_PORT
        + payments.functional.internal.webhook.PATH;
    
    // 결제 이력 등록하기
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
            webhook_url, // 테스트용 웹훅 URL
            price: yourOrderPrice,
            password: "some-password",
        }
    );
    
    // 가상 계좌 입금 시뮬레이션
    await imp.functional.internal.deposit
    (
        await IamportAsset.connection("test-iamport-store-id"),
        payment.response.imp_uid
    );

    // 웹훅 이벤트가 귀하의 백엔드 서버로 전달되기를 기다림.
    await sleep_for(100);

    // 웹훅 이벤트 리스닝 시뮬레이션
    const webhook: IPaymentWebhook = FakePaymentStorage.webhooks.back();
    if (webhook.current.id !== history.id)
        throw new Error("Bug on PaymentWebhooksController.iamport(): failed to deliver the webhook event.");
    else if (webhook.previous.paid_at !== null)
        throw new Error("Bug on PaymentWebhookProvider.process(): failed to delivery the exact previous data.");
    else if (webhook.current.paid_at === null)
        throw new Error("Bug on PaymentWebhookProvider.process(): failed to delivery the exact current data.");

    // 웹훅 데이터 삭제
    FakePaymentStorage.webhooks.pop_back();
}
```

### 3.3. Main Program
[API 인터페이스를 정의](#31-api-interface-definition)하고 그에 관련된 [테스트 자동화 프로그램](#32-test-automation-program)을 제작하였다면, 마지막으로 남은 일은 바로 서버의 메인 프로그램을 작성, 해당 API 를 완성하는 것이다. 앞서 정의한 [API 인터페이스](#31-api-interface-definition) 메서드 내에, 상세 구현 코드를 작성하고, 이를 [테스트 자동화 프로그램](#32-test-automation-program)을 통하여 상시 검증하도록 하자.

단, 모든 소스 코드를 전부 API 컨트롤러의 메서드에 작성하는 우는 범하지 않기를 바란다. API 컨트롤러는 단지 매개체 + a 의 역할만을 해야 할 뿐이며, 주 소스 코드는 [src](src) 폴더 내 각 폴더의 분류에 따라 알맞게 나뉘어 작성되어야 한다. 특히, DB 를 통한 데이터 입출력에 관해서는 가급 [src/providers](src/providers) 를 경유하도록 할 것.

더하여 통합 결제 서버의 설정 정보는 모두 [src/PaymentConfiguration.ts](src/PaymentConfiguration.ts) 에 몰아두었으니, 이 설정 정보들을 귀하의 서비스에 알맞게 수정하는 것 또한 잊지 말기 바란다.

### 3.4. Encryption
모든 데이터는 암호화되어 전송되거나 저장된다.

  - 암호화 방식
    - AES-128/256
    - CBC mode
    - PKCS #5 Padding
    - Base64 Encoding

본 통합 결제 서버 `payments-server` 는 보안을 강화하기 위하여, http 프로토콜로 전송되는 모든 `body` 데이터를 암호화한다 이는 `request body` 와 `response body` 양쪽 모두 해당되는 이야기이며, 설사 http 대신 https 프로토콜을 사용한다 하더라도 예외는 없다.

더하여 `payments-server` 는 결제를 비롯한 모든 민감 데이터들을 암호화하여 저장하고 있다. 또한, 각 암호화 항목마다 각기 다른 secret key 및 initialization vector 를 사용함으로써, 보안을 한층 더 강화하고 있다. 그리고 이러한 민감 데이터들은 일괄 조회가 불가능하며, 오직 개별 단위의 조회만 가능하다. 이 개별 단위의 조회조차, 해당 레코드의 비밀번호를 모르면 일절 조회할 수 없다.

`payments-server` 에는 이처럼 보안 강화를 위한 강력한 암호화 정책들이 존재한다. 혹여 귀하가 본 `payments-server` 를 확장하여 몇 가지 기능을 더 개발한다 하더라도, 이러한 암호화 원칙들은 부디 지켜주었으면 한다.




## 4. Deploy
### 4.1. Non-distruptive Update System
만일 귀하가 통합 결제 서버 `payments-server` 의 코드를 수정하고 이를 커밋하였다면, 귀하는 이를 기존의 서버 인스턴스를 종료하는 일 없이, 무중단 업데이트를 수행할 수 있다. `npm run update` 명령어를 입력함으로써, 이러한 무중단 업데이트는 실행된다.

  - Pull new commit
  - Build the new soure code
  - Restart the backend server without distruption

이러한 무중단 업데이트를 달성하기 위해서는, 서버 인스턴스는 메인 백엔드 서버 프로그램을 시작하기 전, 업데이트 프로그램을 실행해 줄 필요가 있다. 만일 귀하의 서버 인스턴스가 ELB (Elastic Loader Balancer) 등을 통하여 여러 대로 구성되어있고, 현재의 인스턴스가 슬레이브라면, `npm run start:updator:slave` 명령어를 실행해주면 된다.

반면 현재가 마스터 인스턴스라면, `npm run start:updator:master` 명령어를 실행하도록 한다.

```bash
#----
# RUN UPDATOR PROGRAM
#----
# THE INSTANCE IS MASTER
npm run start:updator:master

# THE INSTANCE IS SLAVE
npm run start:updator:slave

#----
# MOUNT THE BACKEND SERVER UP
#----
npm run start real
```

### 4.2. Local Server
간혹 로컬에, [테스트 자동화 프로그램](#33-test-automation-program)이 아닌, `payments-server` 그 자체를 구동해야 할 때가 있다. 이럴 때는 아래와 같이 `npm run start local` 명령어를 입력해주면, 로컬에 `payments-server `서버를 개설할 수 있다. 그리고 실행된 서버를 종료하려거든, `npm run stop` 명령어를 입력해주면 된다.

```bash
npm run start local
npm run stop
```

또한, 로컬 개발 환경에서의 무중단 업데이트가 얼마나 의미가 있겠냐만은, 어쨋든 `payments-server` 는 로컬 환경에서도 무중단 업데이트라는 것을 할 수 있다. 아래와 같이 로컬 서버를 구동하기 전 `npm run start updator:master` 명령어를 통하여 업데이트 관리자 프로그램을 구동하고, 향후 무중단 업데이트가 필요할 때마다 `npm run update local` 명령어를 입력해주면 된다.

```bash
# START THE LOCAL BACKEND SERVER WITH UPDATOR PROGRAM
npm run start updator:master
npm run start local

# UPDATE THE LOCAL SERVER WITHOUT DISTRUPTION
npm run update local
```

### 4.3. Dev Server
Dev 서버를 업데이트하는 것은 매우 간단하다. 그저 소스 코드를 `dev` 브랜치에 커밋한 후, 로컬 개발환경에서 `npm run update dev` 명령어를 입력해주면 끝이다. 이로써 Dev 서버의 소스 코드는 가장 최신의 것으로 바뀌며, 동시에 무중단 업데이트가 실행되어 이것이 서버 API 에 적용될 뿐이다.

```bash
npm run update dev
```

다만 dev 서버의 경우, MariaDB 가 별도의 RDS 로 구성된 게 아닌, `payments-server` 가 설치되고 가동되는 EC2 인스턴스에 함께 설치되기도 한다. 그리고 dev 서버는 로컬 서버와 마찬가지로 테스트 용도를 위하여 개설된 목적인 바, 경우에 따라 DB 를 초기화하고 재 구성해야 하는 경우 또한 생기기 마련이다.

이 경우, 아래와 같이 `npm run ssh:dev` 명령어를 입력하여 dev 서버로 접속한 후, `npm run reset:dev` 명령어를 입력해주면 된다. 이 명령어는 dev 서버의 소스코드를 가장 최신의 것으로 변경한 후, `payments-server` 의 백엔드 및 업데이트 서버를 종료하고, 테스트 프로그램을 가동함으로써 DB 를 초기화하고 필수 및 샘플 데이터를 재 구성한 후, 종료된 `payments-server` 의 백엔드와 업데이트 서버를 재 시작해주는 역할을 한다.

```bash
# 다음 두 명령어로 리셋 가능
npm run ssh:dev
npm run reset:dev

# 참고사항 - npm run reset:dev 를 구성하는 명령어 셋
git pull
npm install
npm run build
pm2 stop all
npm run test -- --mode=dev
npm run start:updator:master
npm run start dev
```

더하여 `payments-server` 를 개발하다보면, 문득 현재 가동 중인 `payments-server` 서버의 정보가 이리저리 궁금해질 수 있다. 가령 현재 가동 중인 dev 서버가 사용 중인 소스 코드가 무엇인지 알고 싶어, 해당 서버가 사용 중인 소스 코드의 commit 에 대한 hash code 를 알고싶을 수도 있는 법이다. 

이 때는 망설이지 말고 바로 아래와 같이, `npm run monitor dev` 명령을 수행해주면, 바로 현재의 dev 서버에 대한 각종 정보를 취득할 수 있다. 취득할 수 있는 정보는 아래와 같이 대분류 주제로는 두 가지, 그리고 소분류로는 다섯 가지가 있다.

  - 퍼포먼스 정보: [IPerformance](src/api/structures/monitors/IPerformance.ts)
    - CPU 사용량
    - 메모리 사용량
    - 리소스 사용량
  - 시스템 정보: [ISystem](src/api/structures/monitors/ISystem.ts)
    - 커밋 정보: 현 서버가 사용 중인 소스 코드의 커밋에 관한 정보
    - 패키지 정보: `package.json`
    - 기타 서버 개설 일시 정보 등

```
npm run monitor dev
```

### 4.4. Real Server
Real 서버를 업데이트하는 일 또한 [dev](#43-dev-server) 서버 때와 마찬가지로 매우 간단하다. 그저 편집한 소스 코드를 `master` 브랜치에 커밋하고, 로컬 개발 환경에서 `npm run update real` 명령어를 실행함으로써, 마스터 서버가 스스로 무중단 업데이트를 수행하도록 할 수 있다.

```bash
npm run update real
```

또한 master 서버에 대하여도, 아래 명령어를 통하여, 각종 정보를 취득할 수 있다.

```bash
npm run monitor master
```




## 5. Appendix
### 5.3. API Documents
본 통합 결제 서버 `payments-server` 는 TypeScript 로 제작되었으며, 이를 이용하는 클라이언트 서버 또한 TypeScript 내지 JavaScript 로 개발하는 것을 가정하였기에, SDK 연동 라이브러리 `payments-api` 를 제공하는 것으로 연동 가이드를 마치고 있다.

하지만 `payments-server` 를 사용하는 클라이언트 서버가 반드시 TypeScript 내지 JavaScript 만으로 개발한다는 보장은 없는 법, 이러한 경우를 위해 별도의 대책을 마련해두었다. 그것은 바로 연동 라이브러리 `payments-api` 의 명세를 직접 읽어보는 것이다. 

`payments-api` 의 제작에 쓰인 [nestia](https://github.com/samchon/nestia) 는 SDK 연동 라이브러리를 빌드하면서, 해당 SDK 라이브러리 코드가 상당 수준의 API 문서 역할을 할 수 있도록, API 명세 및 상세 설명 내역을 깔끔하게 정리하여 보여준다. 아래 예제 코드는 그러한 예시 중 하나이다.

이외에 `payments-server` 는 앞서 [3.4. Encryption](#34-encryption) 단원에서 설명했듯, http(s) 프로토콜을 사용하되 요청 및 응답 `body` 를 `AES-PKCS-5` 알고리즘으로 한 번 더 암호화한다. 아래는 암호화 알고리즘의 상세 정보이니, 이 또한 참고하기 바란다.

  - 암호화 정보
    - AES-128/256
    - CBC mode
    - PKCS #5 Padding
    - Base64 Encoding
  - 자료구조 매뉴얼: [src/api/structures/IPaymentHistory.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/structures/IPaymentHistory.ts)
  - API 함수 매뉴얼: [src/api/functional/histories/index.ts](https://github.surf/samchon/payments/blob/HEAD/src/api/functional/histories/index.ts)
  - 예제 코드
    - 아임포트
      - 결제 기록하기: [test_fake_iamport_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_iamport_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_iamport_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_iamport_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/)
    - 토스 페이먼츠
      - 결제 기록하기: [test_fake_toss_payment_history.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_history.ts)
      - 간편 결제 등록하기: [test_fake_toss_payment_reservation.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_reservation.ts)
      - 웹훅 이벤트 리스닝: [test_fake_toss_payment_webhook.ts](https://github.surf/samchon/payments/blob/HEAD/src/test/features/fake/examples/test_fake_toss_payment_webhook.ts)

```typescript
/**
 * 결제 내역 상세 조회하기.
 * 
 * @param connection connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param id Primary Key
 * @param input 결제 내역의 비밀번호
 * @returns 결제 내역
 * 
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 * @controller PaymentHistoriesController.at()
 * @path PATCH /histories/:id
 */
export function at
    (
        connection: IConnection,
        id: string,
        input: Primitive<at.Input>
    ): Promise<at.Output>
{
    return Fetcher.fetch(connection, at.CONFIG, at.METHOD, at.path(id), input);
}
export namespace at
{
    export type Input = Primitive<IPaymentSource.IPassword>;
    export type Output = Primitive<IPaymentHistory>;

    export const METHOD = "PATCH";
    export const PATH = "/histories/:id";
    export const CONFIG = {
        input_encrypted: true,
        output_encrypted: true,
    };

    export function path(id: string): string
    {
        return `/histories/${id}`;
    }
}
```

### 5.2. NPM Run Commands
현재 package.json 에 정의된 run command 의 역할은 다음과 같다.

  - `build`: 통합 결제 서버 소스 컴파일
  - `build:api`: SDK 연동 라이브러리 컴파일
  - `dev`: 소스 incremental 컴파일
  - `monitor`: 서버의 정보 취득 (`npm run monitor dev`, `npm run monitor real`)
  - `package:api`: SDK 연동 라이브러리 배포
  - `reset:local`: 로컬 DB 리셋
  - `reset:dev`: Dev 서버 종료 후 DB 리셋하여 재시작
  - `ssh:dev`: Dev 서버 터미널 접속
  - `ssh:real`: Real 서버 터미널 접속
  - `start`: 백엔드 서버 가동 (`npm run start dev`, `npm run start real`)
  - `start:updator:master`: 무중단 업데이트 시스템 master 버전 실행
  - `start:updator:slave`: 무중단 업데이트 시스템 slave 버전 실행
  - `start:reload`: 백엔드 서버 재시작, 주로 무중단 업데이트 프로그램에서 사용됨
  - `stop`: 백엔드 서버 중단
  - `stop:updator:master`: 무중단 업데이트 시스템 master 버전 중단
  - `stop:updator:slave`: 무중단 업데이트 시스템 slave 버전 중단
  - `update`: 무중단 업데이트 실행 (`npm run update dev`, `npm run update real`)
  - `test`: 테스트 자동화 프로그램 가동
  - `test:update`: 무중단 업데이트 시스템이 잘 구현되었는 지 검증해 봄

### 5.3. Dependencies
#### 5.3.1. Nestia
Automatic SDK generator for the NestJS.

  - https://github.com/samchon/nestia

Nesita 는 NestJS 로 만든 백엔드 서버 프로그램을 컴파일러 수준에서 분석, 클라이언트가 사용할 수 있는 SDK 라이브러리를 만들어주는 프로그램이다. `payments-server` 에서 분명 통합 결제 서버만 개발했을 뿐인데, 이와 연동할 수 있는 SDK 라이브러리, `paymensts-api` 가 함께 빌드되는 이유가 바로 이 덕분이다.

때문에 만일 귀하가 통합 결제 서버와 연동하는 백엔드 서버를 개발 중이라면, `payments-server` 뿐 아니라 [Nestia](https://github.com/samchon/nestia) 도 함께 사용해보는 것이 어떠한가? 귀하의 백엔드 서버 또한 `payments-server` 처럼 클라이언트 개발자가 사용할 수 있는 SDK 라이브러리를 자동으로 빌드하여 배포할 수 있으니, 백엔드 개발자는 API 문서를 따로 만들고 클라이언트 개발자는 중복 DTO 타입과 API 연동 함수를 개발하는 등의 번거로운 일을 일절 하지 않아도 된다.

#### 5.3.2. Safe-TypeORM
Enhance TypeORM in the compilation level.

  - https://github.com/samchon/safe-typeorm

`safe-typeorm` 은 `typeorm` 을 컴파일 수준에서 강화해주는 헬퍼 라이브러리이다.

이를 사용하면 컴파일 및 단계에서 잘못된 SQL 쿼리문을 바로잡거나, 앱조인을 통하여 퍼포먼스 튜닝을 자동으로 할 수 있고 JSON 변환을 제로 코스트로 할 수 있는 등, 아래와 같은 이점이 있다.

  - When writing [**SQL query**](https://github.com/samchon/safe-typeorm#safe-query-builder),
    - Errors would be detected in the **compilation** level
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - You can implement [**App-join**](https://github.com/samchon/safe-typeorm#app-join-builder) very conveniently
  - When [**SELECT**ing for **JSON** conversion](https://github.com/samchon/safe-typeorm#json-select-builder)
    - [**App-Join**](https://github.com/samchon/safe-typeorm#app-join-builder) with the related entities would be automatically done
    - Exact JSON **type** would be automatically **deduced**
    - The **performance** would be **automatically tuned**
  - When [**INSERT**](https://github.com/samchon/safe-typeorm#insert-collection)ing records
    - Sequence of tables would be automatically sorted by analyzing dependencies
    - The **performance** would be **automatically tuned**

![Safe-TypeORM Demo](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/safe-query-builder.gif)

#### 5.3.3. Fake Payment Servers
본 통합 결제 서버 `payments-server` 가 연동하게 되는 결제 PG 사들은 본디 프론트 어플리케이션과 연동한 수기 테스트가 필요하다. 이 때문에 이들 결제 PG 사들과 연동해야 하는 결제 서버들은, 테스트 자동화 프로그램을 작성할 수 없기에, 필연적으로 테스트 커버리지가 낮아 매우 불안정해진다.

이에 `payments-server` 는 결제 PG 사들의 API 를 모방한 가짜 PG 서버들을 구현, 이들을 통하여 테스트 자동화 프로그램을 구현함으로써, 테스트 커버리지를 높이고 안정성을 담보하였다. 그리고 이들 가짜 결제 PG 사 서버들을 별도 프로젝트로 분리하여 오픈소스로 공개하니, `payments-server` 와 연동하는 귀사의 서비스 백엔드 서버를 개발할 때 (특히 테스트 자동화 프로그램을 개발할 때), 이를 적극 활용하기 바란다.

  - [samchon/fake-iamport-server](https://github.com/samchon/fake-iamport-server)
  - [samchon/fake-toss-payments-server](https://github.com/samchon/fake-toss-payments-server)

```typescript
import { sleep_for } from "tstl/thread/global";
import { v4 } from "uuid";

import toss from "toss-payments-server-api";
import payments from "payments-api";
import { IPaymentHistory } from "payments-api/lib/structures/IPaymentHistory";
import { IPaymentWebhook } from "payments-api/lib/structures/IPaymentWebhook";
import { ITossPayment } from "toss-payments-server-api/lib/structures/ITossPayment";

import { FakePaymentStorage } from "../../../../providers/FakePaymentStorage";
import { PaymentConfiguration } from "../../../../PaymentConfiguration";
import { TossAsset } from "../../../../services/toss/TossAsset";

export async function test_fake_toss_payment_webhook
    (connection: payments.IConnection): Promise<void>
{
    const yourOrderId: string = v4(); // 귀하의 서비스가 발행한 주문 ID
    const yourOrderPrice: number = 25_000; // 주문 금액

    //----
    // 결제 내역 등록
    //----
    // 토스 페이먼츠 가상 결제 시뮬레이션
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

    // 웹훅 URL 설정하기.
    const webhook_url: string = "http://127.0.0.1:"
        + PaymentConfiguration.API_PORT
        + payments.functional.internal.webhook.PATH;
    
    // 결제 이력 등록하기
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

    //----
    // 웹훅 이벤트 리스닝
    //----
    // 입금 시뮬레이션
    await toss.functional.internal.deposit
    (
        TossAsset.connection("test-toss-store-id"),
        payment.paymentKey
    );

    // 웹훅 이벤트가 귀하의 백엔드 서버로 전달되기를 기다림.
    await sleep_for(100);

    // 웹흑 이벤트 리스닝 시뮬레이션.
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
```

### 5.4. Archidraw
https://www.archisketch.com/

I have special thanks to the Archidraw, where I'm working for.

The Archidraw is a great IT company developing 3D interior editor and lots of solutions based on the 3D assets. Also, the Archidraw is the first company who had adopted `payments` on their commercial backend project, even `payments` was in the alpha level.