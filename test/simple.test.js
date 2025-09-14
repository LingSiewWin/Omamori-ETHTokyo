const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Test", function () {
  it("Should work", async function () {
    expect(1 + 1).to.equal(2);
  });
});