import hre, { deployments } from "hardhat"
import { Wallet, Contract, providers } from "ethers"
import { AddressZero } from "@ethersproject/constants";
import solc from "solc"
import { logGas } from "../../src/utils/execution";
import { safeContractUnderTest } from "./config";

export const defaultCallbackHandlerDeployment = async () => {
    return await deployments.get("DefaultCallbackHandler");
}

export const defaultCallbackHandlerContract = async () => {
    return await hre.ethers.getContractFactory("DefaultCallbackHandler");
}

export const compatFallbackHandlerDeployment = async () => {
    return await deployments.get("CompatibilityFallbackHandler");
}

export const compatFallbackHandlerContract = async () => {
    return await hre.ethers.getContractFactory("CompatibilityFallbackHandler");
}

export const getSafeSingleton = async () => {
    const Safe = await hre.ethers.getContractFactory(safeContractUnderTest());
    return await Safe.deploy();
}

export const getFactory = async () => {
    const Factory = await hre.ethers.getContractFactory("GnosisSafeProxyFactory");
    return await Factory.deploy();
}

export const getSimulateTxAccessor = async () => {
    const SimulateTxAccessor = await hre.ethers.getContractFactory("SimulateTxAccessor");
    return await SimulateTxAccessor.deploy();
}

export const getMultiSend = async () => {
    const MultiSend = await hre.ethers.getContractFactory("getMultiSend");
    return await MultiSend.deploy();
}

export const getMultiSendCallOnly = async () => {
    const MultiSend = await hre.ethers.getContractFactory("MultiSendCallOnly");
    return await MultiSend.deploy();
}

export const getCreateCall = async () => {
    const CreateCall = await hre.ethers.getContractFactory("CreateCall");
    return await CreateCall.deploy();
}

export const migrationContract = async () => {
    return await hre.ethers.getContractFactory("Migration");
}


export const getMock = async () => {
    const Mock = await hre.ethers.getContractFactory("MockContract");
    return await Mock.deploy();
}

export const getSafeTemplate = async () => {
    const singleton = await getSafeSingleton()
    const factory = await getFactory()
    const template = await factory.callStatic.createProxy(singleton.address, "0x")
    await factory.createProxy(singleton.address, "0x").then((tx: any) => tx.wait())
    const Safe = await hre.ethers.getContractFactory(safeContractUnderTest());
    return Safe.attach(template);
}

export const getSafeWithOwners = async (owners: string[], threshold?: number, fallbackHandler?: string, logGasUsage?: boolean) => {
    const template = await getSafeTemplate()
    await logGas(
        `Setup Safe with ${owners.length} owner(s)${fallbackHandler && fallbackHandler !== AddressZero ? " and fallback handler" : ""}`, 
        template.setup(owners, threshold || owners.length, AddressZero, "0x", fallbackHandler || AddressZero, AddressZero, 0, AddressZero),
        !logGasUsage
    )
    return template
}

export const getDefaultCallbackHandler = async () => {
    return (await defaultCallbackHandlerContract()).attach((await defaultCallbackHandlerDeployment()).address);
}

export const getCompatFallbackHandler = async () => {
    return (await compatFallbackHandlerContract()).attach((await compatFallbackHandlerDeployment()).address);
}

export const compile = async (source: string) => {
    const input = JSON.stringify({
        'language': 'Solidity',
        'settings': {
            'outputSelection': {
            '*': {
                '*': [ 'abi', 'evm.bytecode' ]
            }
            }
        },
        'sources': {
            'tmp.sol': {
                'content': source
            }
        }
    });
    const solcData = await solc.compile(input)
    const output = JSON.parse(solcData);
    if (!output['contracts']) {
        console.log(output)
        throw Error("Could not compile contract")
    }
    const fileOutput = output['contracts']['tmp.sol']
    const contractOutput = fileOutput[Object.keys(fileOutput)[0]]
    const abi = contractOutput['abi']
    const data = '0x' + contractOutput['evm']['bytecode']['object']
    return {
        "data": data,
        "interface": abi
    }
}

export const deployContract = async (deployer: Wallet, source: string): Promise<Contract> => {
    const output = await compile(source)
    const transaction = await deployer.sendTransaction({ data: output.data, gasLimit: 60000000 })
    const receipt = await transaction.wait()
    return new Contract(receipt.contractAddress, output.interface, deployer)
}

export const deployContractHex = async (deployer: Wallet, source: string, data: string): Promise<Contract> => {
    const output = await compile(source)
    const transaction = await deployer.sendTransaction({ data: data, gasLimit: 60000000 })
    const receipt = await transaction.wait()
    return new Contract(receipt.contractAddress, output.interface, deployer)
}

export const getWallets = () => {
    const accounts = hre.network.config.accounts as string[]
    const provider = new providers.JsonRpcProvider('https://rpc-testnet.lachain.io')

    return accounts.map(key => (new Wallet(key, provider)))
}
