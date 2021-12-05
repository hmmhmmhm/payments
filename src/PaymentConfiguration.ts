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

import { SGlobal } from "./SGlobal";

/**
 * 통합 결제 서버 설정 정보.
 * 
 * @author Samchon
 */
export class PaymentConfiguration
{
    /**
     * 통합 결제 서버의 마스터 IP.
     */
    public static get MASTER_IP(): string
    {
        if (SGlobal.mode === "LOCAL")
            return "127.0.0.1";
        else if (SGlobal.mode === "DEV")
            return "YOUR-DEV-SERVER-HOST";
        else
            return "YOUR-REAL-SERVER-HOST";
    }

    /**
     * DB 접속 정보.
     */
    public static get DB_CONFIG(): MysqlConnectionOptions
    {
        const account: string = (SGlobal.mode === "LOCAL") ? "root" : "payments_w";
        const host: string = (SGlobal.mode === "REAL")
            ? "YOUR-RDS-ADDRESS"
            : "127.0.0.1";

        return {
            // CONNECTION INFO
            type: "mariadb" as const,
            host: host,
            port: 3306,
            username: account,
            password: (SGlobal.mode === "LOCAL") ? "root" : PaymentConfiguration.SYSTEM_PASSWORD,
            database: "payments",

            // OPTIONS
            namingStrategy: new safe.SnakeCaseStrategy(),
            bigNumberStrings: false,
            dateStrings: false,
            entities: [ `${__dirname}/models/**/*.${EXTENSION}` ]
        };
    }
}

export namespace PaymentConfiguration
{
    export const API_PORT = 37821;
    export const UPDATOR_PORT = 37820;
    
    export const ENCRYPTION_PASSWORD: Readonly<helper.IPassword> = {
        key: "SqwHmmXm1fZteI3URPtoyBWFJDMQ7FBQ",
        iv: "9eSfjygAClnE1JJs"
    };

    export const ASSETS = __dirname + "/../assets";
    export const CREATED_AT: Date = new Date();
    export const SYSTEM_PASSWORD: string = "https://github.com/samchon";

    export function toss_secret_key(storeId: string): string
    {
        storeId;
        if (SGlobal.mode === "REAL")
            return "YOUR-REAL-SECRET-KEY";
        else
            return "test_ak_ZORzdMaqN3wQd5k6ygr5AkYXQGwy";
    }

    export function iamport_user_accessor(storeId: string): IIamportUser.IAccessor
    {
        storeId;
        if (SGlobal.mode === "LOCAL")
            return {
                imp_key: "YOUR-LOCAL-IMP-KEY",
                imp_secret: "YOUR-LOCAL-IMP-SECRET"
            };
        else if (SGlobal.mode === "DEV")
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