import { sig } from "./utils";
import assertRevert from "zeppelin-solidity/test/helpers/assertRevert";
import latestTime from "zeppelin-solidity/test/helpers/latestTime";
import increaseTime, {
  duration
} from "zeppelin-solidity/test/helpers/increaseTime";
const SolidityCoder = require("web3/lib/solidity/coder.js");
const TokenBucket = artifacts.require("TokenBucket.sol");
const RasmartToken = artifacts.require("RasmartToken.sol");

contract("TokenBucket", ([owner, minter, first, second, third, fourth]) => {
  let bucket, token, size, rate;
  before(async () => {
    // 5k tokens per second
    rate = 5000 * 10e8;
    // 300k tokens per second (1 minute to fullfil)
    size = 300000 * 10e8;
    token = await RasmartToken.new();
    bucket = await TokenBucket.new(token.address, size, rate);
    await token.addMinter(bucket.address);
    await bucket.addMinter(minter);
  });

  describe("Calculation", () => {
    it("should have full size at start", async () => {
      assert.equal(
        size.toString(),
        (await bucket.availableTokens()).toString(10)
      );
    });

    it("should reject minting from non-minter", async () => {
      await assertRevert(bucket.mint(owner, 10000 * 10e8, sig(owner)));
      await assertRevert(bucket.mint(owner, 10000 * 10e8, sig(first)));
    });

    it("should decrease available after mint", async () => {
      await bucket.mint(first, 10000 * 10e8, sig(minter));
      const available = await bucket.availableTokens();
      assert.isAbove(size, available.toNumber());
    });

    it("should prevent to mint more than available", async () => {
      const size = await bucket.availableTokens();
      await assertRevert(bucket.mint(first, size.add(1), sig(minter)));
    });

    it("should refill bucket after time", async () => {
      const availableAtBegin = await bucket.availableTokens();
      await bucket.mint(second, availableAtBegin, sig(minter));
      const availableAfterMint = await bucket.availableTokens();
      assert.equal(
        0,
        availableAfterMint,
        "Available amount to mint isn't zero after mint"
      );
      await increaseTime(duration.hours(1));
      const availableAfterTime = await bucket.availableTokens();
      assert.equal(
        size,
        availableAfterTime,
        "After minute available hasn't achived size"
      );
    });
  });

  describe("Administration", () => {
    it("should reject changes from strangers", async () => {
      await Promise.all(
        [first, second].map(async account => {
          await assertRevert(bucket.setSize(size + size, sig(account)));
          await assertRevert(bucket.setRate(rate + rate, sig(account)));
          await assertRevert(
            bucket.setSizeAndRate(size + size, rate + rate, sig(account))
          );
        })
      );
    });

    it("should reject changes from minter", async () => {
      await assertRevert(bucket.setSize(size + size, sig(minter)));
      await assertRevert(bucket.setRate(rate + rate, sig(minter)));
      await assertRevert(
        bucket.setSizeAndRate(size + size, rate + rate, sig(minter))
      );
    });

    it("should allow owner to change settings", async () => {
      const rateBefore = await bucket.rate();
      const sizeBefore = await bucket.size();

      await bucket.setRate(rateBefore + 1, sig(owner));
      await bucket.setSize(sizeBefore + 1, sig(owner));

      assert.equal(await bucket.size(), sizeBefore + 1);
      assert.equal(await bucket.rate(), rateBefore + 1);

      await bucket.setSizeAndRate(size + size, rate + rate, sig(owner));

      assert.equal(
        await bucket.size(),
        size + size,
        `incorrect size: ${await bucket.size()} (expect: ${size +
          size} = ${size} + ${size})`
      );
      assert.equal(
        await bucket.rate(),
        rate + rate,
        `incorrect rate: ${await bucket.rate()} (expect: ${rate +
          rate} = ${rate} + ${rate})`
      );
    });

    it("reject minting from strangers", async () => {
      await Promise.all(
        [first, second].map(async account => {
          const available = await bucket.availableTokens();
          assert.isBelow(0, available, "Bucket is dry");
          await assertRevert(bucket.mint(account, available, sig(account)));
        })
      );
    });

    it("allow minter to mint", async () => {
      await bucket.mint(first, 1, sig(minter));
    });
  });

  describe("Minting", () => {
    before(async () => {
      // remove side effects
      // 5k tokens per second
      rate = 5000 * 10e8;
      // 300k tokens per second (1 minute to fullfil)
      size = 300000 * 10e8;
      token = await RasmartToken.new();
      bucket = await TokenBucket.new(token.address, size, rate);
      await token.addMinter(bucket.address);
      await bucket.addMinter(minter);
    });

    it("should fire Mint in token", async () => {
      const tx = await bucket.mint(first, 1000, sig(minter));

      var abis = RasmartToken.abi;

      const knownEvents = abis.reduce((acc, abi) => {
        if (abi.type == "event") {
          var signature =
            abi.name + "(" + _.map(abi.inputs, "type").join(",") + ")";
          acc[web3.sha3(signature)] = {
            signature: signature,
            abi_entry: abi
          };
        }
        return acc;
      }, {});

      const parsedLogs = tx.receipt.logs.map(rawLog => {
        const event = knownEvents[rawLog.topics[0]];

        if (typeof event === "undefined") {
          return null;
        }

        const types = event.abi_entry.inputs
          .map(function(input) {
            return input.indexed == true ? null : input.type;
          })
          .filter(function(type) {
            return type != null;
          });

        const values = SolidityCoder.decodeParams(
          types,
          rawLog.data.replace("0x", "")
        );

        let index = 0;

        return {
          event: event.abi_entry.name,
          args: event.abi_entry.inputs.reduce((acc, input) => {
            acc[input.name] = input.indexed ? "indexed" : values[index++];
            return acc;
          }, {})
        };
      });

      const mintEvents = parsedLogs.filter(log => log.event === "Mint");
      assert.isBelow(0, mintEvents.length, "Mint event not found");
      assert.equal(1000, mintEvents[0].args.amount, "Mint value isn't same");
    });

    it("should increase total supply", async () => {
      const totalBefore = await token.totalSupply();
      await bucket.mint(first, 1000, sig(minter));
      const totalAfter = await token.totalSupply();

      assert.equal(
        1000,
        totalAfter.sub(totalBefore),
        "Total isn't same as minter amount"
      );
    });

    it("should increase balance of beneficiar", async () => {
      const balanceBefore = await token.balanceOf(first);
      await bucket.mint(first, 1000, sig(minter));
      const balanceAfter = await token.balanceOf(first);

      assert.equal(
        1000,
        balanceAfter.sub(balanceBefore),
        "Balance has increased on incorrect amount"
      );
    });
  });

  describe("Changes effect", () => {
    beforeEach(async () => {
      rate = 5000 * 10e8;
      size = 300000 * 10e8;
      token = await RasmartToken.new();
      bucket = await TokenBucket.new(token.address, size, rate);
      await token.addMinter(bucket.address);
      await bucket.addMinter(minter);
    });

    it("size should decrease rate", async () => {
      const availableBefore = await bucket.availableTokens();
      const sizeBefore = await bucket.size();

      await bucket.setSize(sizeBefore - 1000, sig(owner));
      assert.equal(await bucket.availableTokens(), availableBefore - 1000);
    });

    it("should prevent minting in case of lack tokens", async () => {
      let available;
      await bucket.setSize(2, sig(owner));
      await bucket.setRate(0, sig(owner));

      const time = await latestTime();
      await bucket.mint(first, 1, sig(minter));
      assert.equal(await bucket.availableTokens(), 1);
      await bucket.mint(first, 1, sig(minter));
      assert.equal(await bucket.availableTokens(), 0);

      assert.equal(await bucket.availableTokens(), 0);
      await assertRevert(bucket.mint(first, 1, sig(minter)));
      // refill
      await bucket.setRate(1, sig(owner));
      await increaseTime(duration.seconds(1));
      assert.equal(await bucket.availableTokens(), 1);
      await bucket.mint(first, 1, sig(minter));
      assert.equal(await bucket.availableTokens(), 0);
    });
  });
});
