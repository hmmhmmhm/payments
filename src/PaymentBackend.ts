import express from "express";
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import payments from "./api";
import FakeIamport from "fake-iamport-server";
import FakeToss from "fake-toss-payments-server";

import { PaymentConfiguration } from "./PaymentConfiguration";
import { SGlobal } from "./SGlobal";

export class PaymentBackend
{
    private application_?: nest.INestApplication;
    private is_closing_: boolean = false;

    private fake_servers_: IFakeServer[] = [];

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
        if (SGlobal.testing === true)
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

    public async close(): Promise<void>
    {
        if (this.application_ === undefined)
            return;

        // DO CLOSE
        await this.application_.close();
        delete this.application_;
        
        // EXIT FROM THE CRITICAL-SERVER
        if (await SGlobal.critical.is_loaded() === true)
        {
            const critical = await SGlobal.critical.get();
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