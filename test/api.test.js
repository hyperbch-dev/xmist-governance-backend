require("dotenv").config({ path: ".env" });
const user = process.env.AUTH_USER;
const password = process.env.AUTH_PASSWORD;

const fs = require("fs");
const request = require("supertest");

const app = require("../server");

describe("Test", () => {
  beforeAll(async function () {
    try {
      fs.unlinkSync("database/database.db");
      fs.unlinkSync("database/database.db-journal");
    } catch {}
    await app.setup();
  });
  afterAll(async function () {
    app.server.close();
  });

  const expectSuccess = (resp) => {
    if (resp.error) {
      throw resp.error;
    }
    if (resp.statusCode !== 200) {
      throw Error(resp.body.error);
    }
  }

  const expectFail = (resp) => {
    if (resp.statusCode === 200) {
      throw Error(resp.body.error);
    }
    if (!resp.error) {
      throw Error("No error returned");
    }
  }

  it("Should hit basic auth", async () => {
    const success = await request(app).post("/proposal").auth(user, password).send();
    expect(success.statusCode).not.toBe(401);

    const fail = await request(app).post("/proposal").auth('user', 'password').send();
    expect(fail.statusCode).toBe(401);

    const successGetAuth = await request(app).get("/proposal/123").auth('user', 'password').send();
    expect(successGetAuth.statusCode).not.toBe(401);

    const successGet = await request(app).get("/proposal/123").send();
    expect(successGet.statusCode).not.toBe(401);
  });

  it("Should create a snapshot", async () => {
    const response = await request(app).post("/snapshot").auth(user, password).send({
      snapshotBlock: 1130002
    });
    expectSuccess(response);

    const fail = await request(app).post("/snapshot").auth(user, password).send({
      snapshotBlock: 1130002
    });
    expectFail(fail);
    expect(fail.body.error).toBe("Snapshot for block 1130002 already exists");
  });

  it("Should get a snapshot", async () => {
    const response = await request(app).get("/snapshot/1130002").send();
    expectSuccess(response);
    expect(response.body.length).toBeGreaterThan(0);

    const notFound = await request(app).get("/snapshot").send();
    expect(notFound.statusCode).toBe(404);

    const notFoundId = await request(app).get("/snapshot/123").send();
    expect(notFoundId.statusCode).toBe(404);
    expect(notFoundId.body.error).toBe("snapshot not found");
  });

  it("Should create a proposal", async () => {
    const response = await request(app).post("/proposal").auth(user, password).send({
      proposalId: "0001",
      title: "We cool?",
      content: "Are we?",
      options: ["YES", "NO"],
      snapshotBlock: 1130002,
      endBlock: 3130000
    });
    expectSuccess(response);
  });

  it("Should get a proposal", async () => {
    const response = await request(app).get("/proposal/0001").send();
    expectSuccess(response);

    const notFound = await request(app).get("/proposal").send();
    expect(notFound.statusCode).toBe(404);

    const notFoundId = await request(app).get("/proposal/0002").send();
    expect(notFoundId.statusCode).toBe(404);
    expect(notFoundId.body.error).toBe("proposal not found");
  });

  it("Should make votes", async () => {
    const first = await request(app).post("/vote").send({
      sig: "asdf",
      proposalId: "0001",
      choiceId: 1,
      address: "0xe870c1b1f92f5f3d8247340778e806aaf00e5fac",
    });
    expectSuccess(first);

    const fail = await request(app).post("/vote").send({
      sig: "asdf",
      proposalId: "0001",
      choiceId: 0,
      address: "0xe870c1b1f92f5f3d8247340778e806aaf00e5fac",
    });
    expectFail(fail);

    const second = await request(app).post("/vote").send({
      sig: "asdf",
      proposalId: "0001",
      choiceId: 0,
      address: "0x0e91f32c4d39048acf71ae19e974c06e3963bc2f",
    });
    expectSuccess(second);

    const third = await request(app).post("/vote").send({
      sig: "asdf",
      proposalId: "0001",
      choiceId: 1,
      address: "0x5f95895597558c95961963858c240b6510a09ac3",
    });
    expectSuccess(third);

    const proposals = await request(app).get("/proposal/all").send();
    expectSuccess(proposals);
    console.log(proposals.body);
    expect(proposals.body.length).toBeGreaterThan(0);
  });
});
