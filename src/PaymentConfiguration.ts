const EXTENSION = __filename.substr(-2);
if (EXTENSION === "js")
    require("source-map-support").install();
    
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import * as orm from "typeorm";
import safe from "safe-typeorm";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

import { DomainError } from "tstl/exception/DomainError";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { OutOfRange } from "tstl/exception/OutOfRange";

import { IIamportUser } from "iamport-server-api/lib/structures/IIamportUser";

import { PaymentGlobal } from "./PaymentGlobal";

/**
 * 통합 결제 서버 설정 정보.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace PaymentConfiguration
{
    /* -----------------------------------------------------------
        ATOMIC VALUES
    ----------------------------------------------------------- */
    /**
     * API 포트 번호.
     * 
     * 통합 결제 서버가 사용하게 될 포트 번호.
     */
    export let API_PORT: number = 37821;

    /**
     * 업데이터 서버의 포트 번호.
     * 
     * 무중단 업데이트 시스템이 사용하게 될 포트 번호.
     */
    export let UPDATOR_PORT: number = 37820;
    
    /**
     * HTTP body 의 암호화 키 및 IV.
     */
    export let ENCRYPTION_PASSWORD: Readonly<helper.IPassword> = {
        key: "SqwHmmXm1fZteI3URPtoyBWFJDMQ7FBQ",
        iv: "9eSfjygAClnE1JJs"
    };
    
    /**
     * 통합 결제 서버의 시스템 비밀번호.
     * 
     * 무중단 업데이트 시스템의 비밀번호 검증에 쓰인다.
     */
    export let SYSTEM_PASSWORD: string = "https://github.com/samchon";

    /* -----------------------------------------------------------
        CONNECTIONS
    ----------------------------------------------------------- */
    export let master_ip = (): string =>
    {
        if (PaymentGlobal.mode === "LOCAL")
            return "127.0.0.1";
        else if (PaymentGlobal.mode === "DEV")
            return "YOUR-DEV-SERVER-HOST";
        else
            return "YOUR-REAL-SERVER-HOST";
    };

    export let db_config = (): MysqlConnectionOptions =>
    {
        const account: string = (PaymentGlobal.mode === "LOCAL") ? "root" : "payments_w";
        const host: string = (PaymentGlobal.mode === "REAL")
            ? "YOUR-RDS-ADDRESS"
            : "127.0.0.1";

        return {
            // CONNECTION INFO
            type: "mariadb" as const,
            host: host,
            port: 3306,
            username: account,
            password: (PaymentGlobal.mode === "LOCAL") ? "root" : PaymentConfiguration.SYSTEM_PASSWORD,
            database: "payments",

            // OPTIONS
            namingStrategy: new safe.SnakeCaseStrategy(),
            bigNumberStrings: false,
            dateStrings: false,
            entities: [ `${__dirname}/models/**/*.${EXTENSION}` ]
        };
    };

    /* -----------------------------------------------------------
        VENDORS
    ----------------------------------------------------------- */
    /**
     * 토스 페이먼츠의 시크릿 키 getter 함수.
     * 
     * `toss_secret_key` 는 토스 페이먼츠에 사용할 시크릿 키를 리턴해주는 getter 함수로써, 
     * 귀하는 이 함수를 수정하여, 토스 페이먼츠로부터 발급받은 시크릿 키를 리턴하도록 한다.
     * 
     * 만일 귀사의 서비스가 토스 페이먼츠로부터 복수의 스토어 ID 를 발급받았다면, 이 또한 
     * 고려하여 리턴되는 시크릿 키 값을 정해주도록 한다. 또한, 
     * {@link PaymentGlobal.testing 테스트 용도} 내지 {@link PaymentGlobal.mode 개발 서버} 
     * 전용으로 발급받은 스토어 ID 또한 존재한다면, 이 또한 고려토록 한다.
     * 
     * @param storeId 스토어 ID
     * @returns 토스 페이먼츠의 시크릿 키
     */
    export let toss_secret_key = (storeId: string): string =>
    {
        storeId;
        if (PaymentGlobal.mode === "REAL")
            return "YOUR-REAL-SECRET-KEY";
        else
            return "test_ak_ZORzdMaqN3wQd5k6ygr5AkYXQGwy";
    }

    /**
     * 아임포트의 API 및 시크릿 키 getter 함수.
     * 
     * `iamport_user_accessor` 는 아임포트에 사용할 API 및 시크릿 키를 리턴해주는 getter 
     * 함수로써, 귀하는 이 함수를 수정하여, 아임포트로부터 발급받은 API 및 시크릿 키를 
     * 리턴하도록 한다.
     * 
     * 만일 귀사의 서비스가 아임포트로부터 복수의 스토어 ID 를 발급받았다면, 이 또한 
     * 고려하여 리턴되는 API 및 시크릿 키 값을 정해주도록 한다. 또한, 
     * {@link PaymentGlobal.testing 테스트 용도} 내지 {@link PaymentGlobal.mode 개발 서버} 
     * 전용으로 발급받은 스토어 ID 또한 존재한다면, 이 또한 고려토록 한다.
     * 
     * @param storeId 스토어 ID
     * @returns 아임포트의 API 및 시크릿 키
     */
    export let iamport_user_accessor = (storeId: string): IIamportUser.IAccessor =>
    {
        storeId;
        if (PaymentGlobal.mode === "LOCAL")
            return {
                imp_key: "YOUR-LOCAL-IMP-KEY",
                imp_secret: "YOUR-LOCAL-IMP-SECRET"
            };
        else if (PaymentGlobal.mode === "DEV")
            return {
                imp_key: "YOUR-DEV-IMP-KEY",
                imp_secret: "YOUR-DEV-IMP-SECRET"
            };
        else
            return {
                imp_key: "YOUR-REAL-IMP-KEY",
                imp_secret: "YOUR-REAL-IMP-SECRET"
            };
    }

    /**
     * @internal
     */
    export const ASSETS = __dirname + "/../assets";
    
    /**
     * @internal
     */
    export const CREATED_AT: Date = new Date();
}

// CUSTOM EXCEPTIION CONVERSION
helper.ExceptionManager.insert(orm.EntityNotFoundError, exp => new nest.NotFoundException(exp.message));
helper.ExceptionManager.insert(OutOfRange, exp => new nest.NotFoundException(exp.message));
helper.ExceptionManager.insert(InvalidArgument, exp => new nest.ConflictException(exp.message));
helper.ExceptionManager.insert(DomainError, exp => new nest.UnprocessableEntityException(exp.message));

// TRACE EXACT SERVER INTERNAL ERROR
helper.ExceptionManager.insert(Error, exp => new nest.InternalServerErrorException({
    message: exp.message,
    name: exp.name,
    stack: exp.stack
}));