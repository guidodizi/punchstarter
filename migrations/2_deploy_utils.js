const Utils = artifacts.require("Utils");
const PunchStarter = artifacts.require("PunchStarter");
const TestPunchStarter = artifacts.require("TestPunchStarter");

module.exports = async function (deployer) {
  await deployer.deploy(Utils);
  deployer.link(Utils, PunchStarter);
  deployer.link(Utils, TestPunchStarter);
};
