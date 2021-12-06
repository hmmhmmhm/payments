import { MutexConnector } from "mutex-server";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { assertType } from "typescript-is";

import { PaymentConfiguration } from "./PaymentConfiguration";

/**
 * 통합 결제 서버의 전역 변수들 모음.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class PaymentGlobal
{
    /**
     * 백엔드 서버 실행 모드.
     * 
     * 현재의 `payments-server` 가 어느 환경에서 실행되고 있는가.
     * 
     *  - LOCAL: 로컬 시스템
     *  - DEV: 개발 서버
     *  - REAL: 실제 서버
     */
    public static get mode(): "LOCAL" | "DEV" | "REAL"
    {
        return mode_;
    }

    public static setMode(mode: typeof PaymentGlobal.mode): void
    {
        assertType<typeof mode>(mode);
        mode_ = mode;
    }
}
export namespace PaymentGlobal
{
    /**
     * 테스트 여부.
     * 
     * 현 `payments-server` 가 테스트 자동화 프로그램에서 구동 중인지 여부.
     * 
     * 만일 이 값이 true 이거든, 통합 결제 백엔드 서버를 구동할 때, 이와 연동하게 될
     * 각종 가짜 결제 PG 서버들도 함께 구동된다. 현재 본 `payments-server` 의 테스트
     * 자동화 프로그램과 연동되는 가짜 PG 서버들의 목록은 아래와 같다.
     * 
     *  - [fake-iamport-server](https://github.com/samchon/fake-iamport-server)
     *  - [fake-toss-payments-server](https://github.com/samchon/fake-toss-payments-server)
     * 
     * 더하여 현 서버가 로컬 시스템에서 구동된다 하여 반드시 테스트 중이라는 보장은 
     * 없으며, 반대로 현 서버가 테스트 중이라 하여 반드시 로컬 시스템이라는 보장 또한 
     * 없으니, 이 점을 착각하지 말기 바란다.
     */
    export let testing: boolean = false;

    /**
     * 네트워크 수준의 임계 영역 제어자.
     * 
     * `payments-server` 는 보통 여러 개의 프로세스로 나뉘어 개설되기 마련이다. 한
     * 인스턴스 내에서 PM2 에 의하여 멀티 프로세스로 개설되기도 하고, ELB (Elastic
     * Load Balancer) 로 묶은 복수의 인스턴스에서 복수의 프로세스로 개설되기도 한다.
     * 
     * `SGlobal.critical` 은 이렇게 여러 프로세스 및 여러 인스턴스에 대하여, 전역적인
     * 임계 영역을 관리해주는 객체이다. 이를 통하여 전 네트워크 수준의 뮤텍스나 세마포어
     * 등을 생성하여, 전 서버 단위의 임계 영역을 제어할 수 있다.
     */
    export const critical: MutableSingleton<MutexConnector<string, null>> = new MutableSingleton(async () =>
    {
        const connector: MutexConnector<string, null> = new MutexConnector(PaymentConfiguration.SYSTEM_PASSWORD, null);
        await connector.connect(`ws://${PaymentConfiguration.master_ip()}:${PaymentConfiguration.UPDATOR_PORT}/api`);
        return connector;
    });
}

/**
 * @internal
 */
let mode_: "LOCAL" | "DEV" | "REAL" = "LOCAL";