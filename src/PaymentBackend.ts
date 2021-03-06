import express from "express";
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import payments from "./api";
import FakeIamport from "fake-iamport-server";
import FakeToss from "fake-toss-payments-server";

import { PaymentConfiguration } from "./PaymentConfiguration";
import { PaymentGlobal } from "./PaymentGlobal";

/**
 * 통합 결제 백엔드 서버.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class PaymentBackend
{
    private application_?: nest.INestApplication;
    private is_closing_: boolean = false;

    private fake_servers_: IFakeServer[] = [];

    /**
     * 서버 개설하기.
     * 
     * 통합 결제 백엔드 서버를 개설한다. 이 때 개설되는 서버의 종류는 
     * {@link PaymentGlobal.mode} 를 따르며, 만일 개설되는 서버가 테스트 자동화 프로그램에
     * 의하여 시작된 것이라면 ({@link PaymentGlobal.testing} 값이 true), 이와 연동하게 될
     * 가짜 PG 결제사 서버들도 함께 개설한다.
     */
    public async open(): Promise<void>
    {
        //----
        // OPEN THE BACKEND SERVER
        //----
        // MOUNT CONTROLLERS
        this.application_ = await NestFactory.create
        (
            await helper.EncryptedModule.dynamic
            (
                __dirname + "/controllers", 
                PaymentConfiguration.ENCRYPTION_PASSWORD
            ),
            { logger: false }
        );
        
        // CONFIGURATIONS
        this.is_closing_ = false;
        this.application_.enableCors();
        this.application_.use(this.middleware.bind(this));

        // DO OPEN
        await this.application_.listen(PaymentConfiguration.API_PORT);

        // CONFIGURE FAKE SERVERS IF TESTING
        if (PaymentGlobal.testing === true)
        {
            // OPEN FAKE SERVERS
            this.fake_servers_ = [
                new FakeIamport.FakeIamportBackend(),
                new FakeToss.FakeTossBackend()
            ];
            for (const s of this.fake_servers_)
                await s.open();

            const host: string = `http://127.0.0.1:${PaymentConfiguration.API_PORT}`;

            // CONFIGURE WEBHOOK URLS
            FakeIamport.FakeIamportConfiguration.WEBHOOK_URL = `${host}${payments.functional.webhooks.iamport.PATH}`;
            FakeToss.TossFakeConfiguration.WEBHOOK_URL = `${host}${payments.functional.webhooks.toss.PATH}`;
        }

        //----
        // POST-PROCESSES
        //----
        // INFORM TO THE PM2
        if (process.send)
            process.send("ready");

        // WHEN KILL COMMAND COMES
        process.on("SIGINT", async () =>
        {
            this.is_closing_ = true;
            await this.close();
            process.exit(0);
        });
    }

    /**
     * 개설한 서버 닫기.
     */
    public async close(): Promise<void>
    {
        if (this.application_ === undefined)
            return;

        // DO CLOSE
        await this.application_.close();
        delete this.application_;
        
        // EXIT FROM THE CRITICAL-SERVER
        if (await PaymentGlobal.critical.is_loaded() === true)
        {
            const critical = await PaymentGlobal.critical.get();
            await critical.close();
        }

        // CLOSE FAKE SERVERS
        for (const s of this.fake_servers_)
            await s.close();
        this.fake_servers_ = [];
    }

    private middleware
        (
            _request: express.Request, 
            response: express.Response, 
            next: Function
        ): void
    {
        if (this.is_closing_ === true)
            response.set("Connection", "close");
        next();
    }
}

interface IFakeServer
{
    open(): Promise<void>;
    close(): Promise<void>;
}