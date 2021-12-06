import * as orm from "typeorm";

/**
 * 통합 결제 서버 설치 마법사.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace PaymentSetupWizard
{
    /**
     * DB 설치하기.
     * 
     * 기존의 `payments-server` 관련 테이블을 모두 삭제하고, 테이블을 재 구성한다.
     * 
     * @param connection DB 커넥션 정보.
     */
    export async function schema(connection: orm.Connection): Promise<void>
    {
        await connection.dropDatabase();
        await connection.synchronize();
    }
}