import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { deployContract, deployContractHex, getSafeWithOwners, getWallets} from "../utils/setup";
import { safeApproveHash, buildSignatureBytes, executeContractCallWithSigners, buildSafeTransaction, executeTx, calculateSafeTransactionHash, buildContractCall } from "../../src/utils/execution";
import { parseEther } from "@ethersproject/units";
import { chainId } from "../utils/encoding";

describe("GnosisSafe", async () => {

    const [user1, user2] = getWallets();

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const setterSource = `
            contract StorageSetter {
                function setStorage(bytes3 data) public {
                    bytes32 slot = 0x4242424242424242424242424242424242424242424242424242424242424242;
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        sstore(slot, data)
                    }
                }
            }`
        const storageSetter = await deployContractHex(user1, setterSource, '0x0061736D01000000011C0660017F006000017F60037F7F7F0060027F7F0060017F017F60000002610503656E760C6765745F6D736776616C7565000003656E760D6765745F636F64655F73697A65000103656E760F636F70795F636F64655F76616C7565000203656E760A7365745F72657475726E000303656E760B73797374656D5F68616C74000003040304050505030100020608017F01418080040B071202066D656D6F7279020005737461727400070ACE0203A60101047F418080042101024003400240200128020C0D002001280208220220004F0D020B200128020022010D000B41002101410028020821020B02402002200041076A41787122036B22024118490D00200120036A41106A22002001280200220436020002402004450D00200420003602040B2000200241706A3602082000410036020C2000200136020420012000360200200120033602080B2001410136020C200141106A0B2E004100410036028080044100410036028480044100410036028C800441003F0041107441F0FF7B6A36028880040B7501027F230041206B220024002000100002402000290300200041106A29030084200041086A290300200041186A29030084844200520D0010064100100141CA6F6A220036029C0A41002000100522013602A00A200141B610200010024100419A0A100341001004000B41004100100341011004000B0BA10A010041000B9A0A0061736D01000000011C0660017F006000017F60037F7F7F0060027F7F0060017F017F6000000287010703656E760C6765745F6D736776616C7565000003656E760D6765745F63616C6C5F73697A65000103656E760F636F70795F63616C6C5F76616C7565000203656E760C6C6F61645F73746F72616765000303656E760A7365745F72657475726E000303656E760B73797374656D5F68616C74000003656E760C736176655F73746F72616765000303070603020204050505030100020608017F01418080040B071202066D656D6F72790200057374617274000C0AF90506240002402001450D00034020004200370300200041086A21002001417F6A22010D000B0B0B29002000417F6A210003402001200020026A2D00003A0000200141016A21012002417F6A22020D000B0B29002001417F6A21010340200120026A20002D00003A0000200041016A21002002417F6A22020D000B0BA60101047F418080042101024003400240200128020C0D002001280208220220004F0D020B200128020022010D000B41002101410028020821020B02402002200041076A41787122036B22024118490D00200120036A41106A22002001280200220436020002402004450D00200420003602040B2000200241706A3602082000410036020C2000200136020420012000360200200120033602080B2001410136020C200141106A0B2E004100410036028080044100410036028480044100410036028C800441003F0041107441F0FF7B6A36028880040BA60301047F230041F0006B22002400200041086A1000024002400240024002402000290308200041186A29030084200041106A290300200041206A29030084844200520D00100B41001001220136020441002001100A22023602084100200120021002200141034D0D014100200228020022033602000240200341A4E9B2997C460D00200341F3A887D503470D02200041E8006A4200370300200042003703602000420037035820004200370350200041D0006A200041306A10032000200041326A2D00003A002A200020002F01303B01284100450D0341004100100441011005000B2001417C6A4120490D03200241046A2000412C6A4103100820002F012C210120002D002E2102200041E8006A4200370300200042003703602000420037035820004200370350200041306A41041007200020023A0032200020013B0130200041D0006A200041306A100641010D0441004100100441011005000B41004100100441011005000B41004100100441011005000B200041286A4120100A22004103100920004120100441001005000B200041F0006A240041020F0B41004100100441001005000B007D0970726F647563657273010C70726F6365737365642D62790105636C616E675D31322E302E31202868747470733A2F2F6769746875622E636F6D2F736F6C616E612D6C6162732F6C6C766D2D70726F6A65637420373437343534623061653535366461313230623961643136343561313365343863343036303161362900C001046E616D6501A4010D000C6765745F6D736776616C7565010D6765745F63616C6C5F73697A65020F636F70795F63616C6C5F76616C7565030C6C6F61645F73746F72616765040A7365745F72657475726E050B73797374656D5F68616C74060C736176655F73746F7261676507085F5F627A65726F38080A5F5F62654E746F6C654E090A5F5F6C654E746F62654E0A085F5F6D616C6C6F630B0B5F5F696E69745F686561700C057374617274071201000F5F5F737461636B5F706F696E746572007D0970726F647563657273010C70726F6365737365642D62790105636C616E675D31322E302E31202868747470733A2F2F6769746875622E636F6D2F736F6C616E612D6C6162732F6C6C766D2D70726F6A656374203734373435346230616535353664613132306239616431363435613133653438633430363031613629008D01046E616D65016608000C6765745F6D736776616C7565010D6765745F636F64655F73697A65020F636F70795F636F64655F76616C7565030A7365745F72657475726E040B73797374656D5F68616C7405085F5F6D616C6C6F63060B5F5F696E69745F6865617007057374617274071201000F5F5F737461636B5F706F696E746572090A0100072E726F64617461');
        const reverterSource = `
            contract Reverter {
                function revert() public {
                    require(false, "Shit happens");
                }
            }`
        const reverter = await deployContractHex(user1, reverterSource, '0x0061736D01000000011C0660017F006000017F60037F7F7F0060027F7F0060017F017F60000002610503656E760C6765745F6D736776616C7565000003656E760D6765745F636F64655F73697A65000103656E760F636F70795F636F64655F76616C7565000203656E760A7365745F72657475726E000303656E760B73797374656D5F68616C74000003040304050505030100020608017F01418080040B071202066D656D6F7279020005737461727400070ACE0203A60101047F418080042101024003400240200128020C0D002001280208220220004F0D020B200128020022010D000B41002101410028020821020B02402002200041076A41787122036B22024118490D00200120036A41106A22002001280200220436020002402004450D00200420003602040B2000200241706A3602082000410036020C2000200136020420012000360200200120033602080B2001410136020C200141106A0B2E004100410036028080044100410036028480044100410036028C800441003F0041107441F0FF7B6A36028880040B7501027F230041206B220024002000100002402000290300200041106A29030084200041086A290300200041186A29030084844200520D0010064100100141DE6F6A22003602880A410020001005220136028C0A200141A21020001002410041860A100341001004000B41004100100341011004000B0B8D0A010041000B860A0061736D0100000001230760017F006000017F60037F7F7F0060027F7F0060037F7F7F017F60017F017F60000002610503656E760C6765745F6D736776616C7565000003656E760D6765745F63616C6C5F73697A65000103656E760F636F70795F63616C6C5F76616C7565000203656E760A7365745F72657475726E000303656E760B73797374656D5F68616C7400000308070202020405060605030100020608017F01418080040B071202066D656D6F72790200057374617274000B0AF305072E0002402002450D000340200020012D00003A0000200041016A2100200141016A21012002417F6A22020D000B0B0B2D002001411F6A21010340200120002D00003A00002001417F6A2101200041016A21002002417F6A22020D000B0B29002001417F6A21010340200120026A20002D00003A0000200041016A21002002417F6A22020D000B0B7E01017F200120006C220141086A10092203200036020420032000360200200341086A2100024002402002417F460D002001450D010340200020022D00003A0000200041016A2100200241016A21022001417F6A22010D000C020B0B2001450D000340200041003A0000200041016A21002001417F6A22010D000B0B20030BA60101047F418080042101024003400240200128020C0D002001280208220220004F0D020B200128020022010D000B41002101410028020821020B02402002200041076A41787122036B22024118490D00200120036A41106A22002001280200220436020002402004450D00200420003602040B2000200241706A3602082000410036020C2000200136020420012000360200200120033602080B2001410136020C200141106A0B2E004100410036028080044100410036028480044100410036028C800441003F0041107441F0FF7B6A36028880040B930201057F230041306B2200240020001000024002402000290300200041106A29030084200041086A290300200041186A29030084844200520D00100A41001001220136021041002001100922023602144100200120021002200141034D0D0141002002280200220136020C2001419CA4BDD205470D01410C4101410010082202280200410020021B413F6A41607141246A220310092101200041A0F38DC600360224200041246A20014104100720004120360228200041286A200141046A4104100620002002280200410020021B220436022C2000412C6A200141246A41041006200141C4006A200241086A2004100520012003100341011004000B41004100100341011004000B41004100100341011004000B0B12010041000B0C536869742068617070656E73007D0970726F647563657273010C70726F6365737365642D62790105636C616E675D31322E302E31202868747470733A2F2F6769746875622E636F6D2F736F6C616E612D6C6162732F6C6C766D2D70726F6A65637420373437343534623061653535366461313230623961643136343561313365343863343036303161362900BD01046E616D650195010C000C6765745F6D736776616C7565010D6765745F63616C6C5F73697A65020F636F70795F63616C6C5F76616C7565030A7365745F72657475726E040B73797374656D5F68616C7405085F5F6D656D637079060B5F5F6C654E746F62653332070A5F5F6C654E746F62654E080A766563746F725F6E657709085F5F6D616C6C6F630A0B5F5F696E69745F686561700B057374617274071201000F5F5F737461636B5F706F696E746572090A0100072E726F64617461007D0970726F647563657273010C70726F6365737365642D62790105636C616E675D31322E302E31202868747470733A2F2F6769746875622E636F6D2F736F6C616E612D6C6162732F6C6C766D2D70726F6A656374203734373435346230616535353664613132306239616431363435613133653438633430363031613629008D01046E616D65016608000C6765745F6D736776616C7565010D6765745F636F64655F73697A65020F636F70795F636F64655F76616C7565030A7365745F72657475726E040B73797374656D5F68616C7405085F5F6D616C6C6F63060B5F5F696E69745F6865617007057374617274071201000F5F5F737461636B5F706F696E746572090A0100072E726F64617461');
        return {
            safe: await getSafeWithOwners([user1.address]),
            reverter,
            storageSetter
        }
    })

    describe("execTransaction", async () => {

        it('should revert if too little gas is provided', async () => {
            const { safe } = await setupTests()
            const tx = buildSafeTransaction({ to: safe.address, safeTxGas: 1000000, nonce: await safe.nonce() })
            const signatureBytes = buildSignatureBytes([await safeApproveHash(user1, safe, tx, true)])
            await expect(
                safe.execTransaction(
                    tx.to, tx.value, tx.data, tx.operation, tx.safeTxGas, tx.baseGas, tx.gasPrice, tx.gasToken, tx.refundReceiver, signatureBytes,
                    { gasLimit: 1000000 }
                )
            ).to.be.revertedWith("GS010")
        })

        it('should emit event for successful call execution', async () => {
            const { safe, storageSetter } = await setupTests()
            const txHash = calculateSafeTransactionHash(safe, buildContractCall(storageSetter, "setStorage", ["0xbaddad"], await safe.nonce()), await chainId())
            await expect(
                executeContractCallWithSigners(safe, storageSetter, "setStorage", ["0xbaddad"], [user1])
            ).to.emit(safe, "ExecutionSuccess").withArgs(txHash, 0)

            await expect(
                await hre.ethers.provider.getStorageAt(safe.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "".padEnd(64, "0"))

            await expect(
                await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"))
        })

        it('should emit event for failed call execution if safeTxGas > 0', async () => {
            const { safe, reverter } = await setupTests()
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1], false, { safeTxGas: 1 })
            ).to.emit(safe, "ExecutionFailure")
        })

        it('should emit event for failed call execution if gasPrice > 0', async () => {
            const { safe, reverter } = await setupTests()
            // Fund refund
            await user1.sendTransaction({ to: safe.address, value: 10000000 })
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1], false, { gasPrice: 1 })
            ).to.emit(safe, "ExecutionFailure")
        })

        it('should revert for failed call execution if gasPrice == 0 and safeTxGas == 0', async () => {
            const { safe, reverter } = await setupTests()
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1])
            ).to.revertedWith("GS013")
        })

        it('should emit event for successful delegatecall execution', async () => {
            const { safe, storageSetter } = await setupTests()
            await expect(
                executeContractCallWithSigners(safe, storageSetter, "setStorage", ["0xbaddad"], [user1], true)
            ).to.emit(safe, "ExecutionSuccess")

            await expect(
                await hre.ethers.provider.getStorageAt(safe.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "baddad".padEnd(64, "0"))

            await expect(
                await hre.ethers.provider.getStorageAt(storageSetter.address, "0x4242424242424242424242424242424242424242424242424242424242424242")
            ).to.be.eq("0x" + "".padEnd(64, "0"))
        })

        it('should emit event for failed delegatecall execution  if safeTxGas > 0', async () => {
            const { safe, reverter } = await setupTests()
            const txHash = calculateSafeTransactionHash(safe, buildContractCall(reverter, "revert", [], await safe.nonce(), true, { safeTxGas: 1 }), await chainId())
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1], true, { safeTxGas: 1 })
            ).to.emit(safe, "ExecutionFailure").withArgs(txHash, 0)
        })

        it('should emit event for failed delegatecall execution if gasPrice > 0', async () => {
            const { safe, reverter } = await setupTests()
            await user1.sendTransaction({ to: safe.address, value: 10000000 })
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1], true, { gasPrice: 1 })
            ).to.emit(safe, "ExecutionFailure")
        })

        it('should emit event for failed delegatecall execution if gasPrice == 0 and safeTxGas == 0', async () => {
            const { safe, reverter } = await setupTests()
            await expect(
                executeContractCallWithSigners(safe, reverter, "revert", [], [user1], true)
            ).to.revertedWith("GS013")
        })

        it('should revert on unknown operation', async () => {
            const { safe } = await setupTests()
            const tx = buildSafeTransaction({ to: safe.address, nonce: await safe.nonce(), operation: 2 })
            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)])
            ).to.be.reverted
        })

        it('should emit payment in success event', async () => {
            const { safe } = await setupTests()
            const tx = buildSafeTransaction({
                to: user1.address, nonce: await safe.nonce(), operation: 0, gasPrice: 1, safeTxGas: 100000, refundReceiver: user2.address
            })

            await user1.sendTransaction({ to: safe.address, value: parseEther("1") })
            const userBalance = await hre.ethers.provider.getBalance(user2.address)
            await expect(await hre.ethers.provider.getBalance(safe.address)).to.be.deep.eq(parseEther("1"))

            let executedTx: any;
            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)]).then((tx) => { executedTx = tx; return tx })
            ).to.emit(safe, "ExecutionSuccess")
            const receipt = await hre.ethers.provider.getTransactionReceipt(executedTx!!.hash)
            const logIndex = receipt.logs.length - 1
            const successEvent = safe.interface.decodeEventLog("ExecutionSuccess", receipt.logs[logIndex].data, receipt.logs[logIndex].topics)
            expect(successEvent.txHash).to.be.eq(calculateSafeTransactionHash(safe, tx, await chainId()))
            // Gas costs are around 3000, so even if we specified a safeTxGas from 100000 we should not use more
            expect(successEvent.payment.toNumber()).to.be.lte(5000)
            await expect(await hre.ethers.provider.getBalance(user2.address)).to.be.deep.eq(userBalance.add(successEvent.payment))
        })

        it('should emit payment in failure event', async () => {
            const { safe, storageSetter } = await setupTests()
            const data = storageSetter.interface.encodeFunctionData("setStorage", [0xbaddad])
            const tx = buildSafeTransaction({
                to: storageSetter.address, data, nonce: await safe.nonce(), operation: 0, gasPrice: 1, safeTxGas: 3000, refundReceiver: user2.address
            })

            await user1.sendTransaction({ to: safe.address, value: parseEther("1") })
            const userBalance = await hre.ethers.provider.getBalance(user2.address)
            await expect(await hre.ethers.provider.getBalance(safe.address)).to.be.deep.eq(parseEther("1"))

            let executedTx: any;
            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)]).then((tx) => { executedTx = tx; return tx })
            ).to.emit(safe, "ExecutionFailure")
            const receipt = await hre.ethers.provider.getTransactionReceipt(executedTx!!.hash)
            const logIndex = receipt.logs.length - 1
            const successEvent = safe.interface.decodeEventLog("ExecutionFailure", receipt.logs[logIndex].data, receipt.logs[logIndex].topics)
            expect(successEvent.txHash).to.be.eq(calculateSafeTransactionHash(safe, tx, await chainId()))
            // FIXME: When running out of gas the gas used is slightly higher than the safeTxGas and the user has to overpay
            expect(successEvent.payment.toNumber()).to.be.lte(10000)
            await expect(await hre.ethers.provider.getBalance(user2.address)).to.be.deep.eq(userBalance.add(successEvent.payment))
        })

        it('should be possible to manually increase gas', async () => {
            const { safe } = await setupTests()
            const gasUserSource = `
            contract GasUser {
        
                uint256[] public data;
        
                constructor() payable {}
        
                function nested(uint256 level, uint256 count) external {
                    if (level == 0) {
                        for (uint256 i = 0; i < count; i++) {
                            data.push(i);
                        }
                        return;
                    }
                    this.nested(level - 1, count);
                }
        
                function useGas(uint256 count) public {
                    this.nested(6, count);
                    this.nested(8, count);
                }
            }`
            const gasUser = await deployContract(user1, gasUserSource);
            const to = gasUser.address
            const data = gasUser.interface.encodeFunctionData("useGas", [80])
            const safeTxGas = 10000
            const tx = buildSafeTransaction({ to, data, safeTxGas, nonce: await safe.nonce() })
            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)], { gasLimit: 170000 }),
                "Safe transaction should fail with low gasLimit"
            ).to.emit(safe, "ExecutionFailure")

            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)], { gasLimit: 6000000 }),
                "Safe transaction should succeed with high gasLimit"
            ).to.emit(safe, "ExecutionSuccess")

            // This should only work if the gasPrice is 0
            tx.gasPrice = 1
            await user1.sendTransaction({ to: safe.address, value: parseEther("1") })
            await expect(
                executeTx(safe, tx, [await safeApproveHash(user1, safe, tx, true)], { gasLimit: 6000000 }),
                "Safe transaction should fail with gasPrice 1 and high gasLimit"
            ).to.emit(safe, "ExecutionFailure")
        })
    })
})