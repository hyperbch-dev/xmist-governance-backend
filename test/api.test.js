const fs = require("fs");
const request = require("supertest");

const app = require("../server");

describe("Test", () => {
  beforeAll(async function () {
    fs.unlinkSync("database/database.db");
    fs.unlinkSync("database/database.db-journal");
    await app.setup();
  });
  afterAll(async function () {
    app.server.close();
  });

  const checkResponse = (resp) => {
    if (resp.statusCode !== 200) {
      throw Error(resp.body.error);
    }
  }

  it("Should create a proposal", async () => {
    const response = await request(app).post("/proposal").send({
      "proposalId": "0001",
      "title": "We cool?",
      "content": "Are we?",
      "options": ["YES", "NO"],
      "snapshotBlock": 1130002,
      "endBlock": 3130000
    });
    checkResponse(response);
  });

  it("Should get a proposal", async () => {
    const response = await request(app).get("/proposal/0001").send();
    checkResponse(response);

    const notFound = await request(app).get("/proposal").send();
    expect(notFound.statusCode).toBe(404);

    const notFoundId = await request(app).get("/proposal/0002").send();
    expect(notFoundId.statusCode).toBe(404);
    expect(notFoundId.body.error).toBe("proposal not found");
  });

  it("Should make votes", async () => {
    const response = await request(app).post("/vote").send({
      sig: "asdf",
      proposalId: "0001",
      choiceId: 1,
      address: "asdf",
    });
    checkResponse(response);
  });
});
