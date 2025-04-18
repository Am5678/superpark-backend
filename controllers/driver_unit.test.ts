import { expect, test, mock, describe, jest } from "bun:test"
import * as me from "../models/errors.ts";
import * as bc from "bcrypt"

import * as dc from "./driver_controller.ts"

mock.module("../models/driver_model.ts", () => {
    return {
        create: async (email: string, password: string) => {
            if (email == "existing@mail.com") {
                return { type: me.DuplError }
            } else if (email == "error@mail.com") {
                return { type: me.UnknownError }
            } else {
                return null
            }
        },
        fetchPass: async (email: string) => {
            if (email == "existing@mail.com") {
                return {type: me.NoError, passHash: bc.hashSync("password", 10)}
            } else if (email == "error@mail.com") {
                return { type: me.UnknownError }
            } else {
                return {type: me.NotExistError}
            }
        },
        createToken: async (email: string, token: string) => {
        },
        startSession: async (driverEmail: string, parkingOwnerEmail: string) => {
            if (parkingOwnerEmail == "unknownerror@mail.com") {
                return { type: me.UnknownError }
            } else if (parkingOwnerEmail == "duplicate@mail.com") {
                return { type: me.DuplError }
            } else {
                return { type: me.NoError, sessionID: "session123", lat: 40.7128, lon: -74.0060, startTime: new Date().toISOString() }
            }
        },
        stopSession: async (sessionID: string) => {
            if (sessionID == "unknownerror") {
                return { type: me.UnknownError }
            } else {
                return { type: me.NoError }
            }
        }
    }
})

function jestRes() {
    return { send: jest.fn(), status: jest.fn(), sendStatus: jest.fn() }
}

describe("driver signup", async () => {
    test("duplicate email", async () => {
        const mReq = {
            body: { email: "existing@mail.com", password: "p" }
        }
        const mRes = jestRes()
        await dc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })
    test("missing fields", async () => {
        const mReq = {
            body: { email: "abc@x.com" }
        }
        const mRes = jestRes()
        await dc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })
    test("unknown error", async () => {
        const mReq = {
            body: { email: "error@mail.com", password: "124" }
        }
        const mRes = jestRes()
        await dc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(500)
    })
    test("success", async () => {
        const mReq = {
            body: { email: "random@mail.com", password: "abcd" }
        }
        const mRes = jestRes()
        await dc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(201)
    })
})

describe("driver authentication", async () => {
    test("missing fields", async () => {
        const mReq = {
            body: { email: "abc@x.com" }
        }
        const mRes = jestRes()
        await dc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })

    test("incorrect password", async () => {
        const mReq = {
            body: { email: "existing@mail.com", password: "wrongpassword" }
        }
        const mRes = jestRes()
        await dc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(401)
    })

    test("unknown error", async () => {
        const mReq = {
            body: { email: "error@mail.com", password: "password" }
        }
        const mRes = jestRes()
        await dc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(401)
        expect(mRes.send).toBeCalledWith({ msg: "Not authenticated or unknown error" })
    })

    test("success", async () => {
        const mReq = {
            body: { email: "existing@mail.com", password: "password" }
        }
        const mRes = jestRes()
        await dc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(201)
        expect(mRes.send).toBeCalledWith(expect.objectContaining({ token: expect.any(String) }))
    })
})

describe("driver session management", async () => {
    test("start session - missing parkingOwner", async () => {
        const mReq = {
            headers: { "x-email": "driver@mail.com" },
            query: {}
        }
        const mRes = jestRes()
        await dc.startSessionPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })

    test("start session - unknown error", async () => {
        const mReq = {
            headers: { "x-email": "driver@mail.com" },
            query: { parkingOwnerEmail: "unknownerror@mail.com" }
        }
        const mRes = jestRes()
        await dc.startSessionPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(501)
    })

    test("start session - duplicate session", async () => {
        const mReq = {
            headers: { "x-email": "driver@mail.com" },
            query: { parkingOwnerEmail: "duplicate@mail.com" }
        }
        const mRes = jestRes()
        await dc.startSessionPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })

    test("start session - success", async () => {
        const mReq = {
            headers: { "x-email": "driver@mail.com" },
            query: { parkingOwnerEmail: "success@mail.com" }
        }
        const mRes = jestRes()
        await dc.startSessionPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(201)
        expect(mRes.send).toBeCalledWith(expect.objectContaining({ sessionID: expect.any(String), lat: expect.any(Number), lon: expect.any(Number), startTime: expect.any(String) }))
    })
})


