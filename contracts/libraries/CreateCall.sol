// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/// @title Create Call - Allows to use the different create opcodes to deploy a contract
/// @author Richard Meissner - <richard@gnosis.io>
contract CreateCall {
    event ContractCreation(address newContract);

    function performCreate2(
        uint256 value,
        bytes memory deploymentData,
        bytes32 salt
    ) public returns (address newContract) {
        // solhint-disable-next-line no-inline-assembly
        (, bytes memory result) =  address(0).call{value: value}(deploymentData);
        (newContract) = abi.decode(result, address);
        require(newContract != address(0), "Could not deploy contract");
        emit ContractCreation(newContract);
    }

    function performCreate(uint256 value, bytes memory deploymentData) public returns (address newContract) {
        // solhint-disable-next-line no-inline-assembly
        (, bytes memory result) =  address(0).call{value: value}(deploymentData);
        (newContract) = abi.decode(result, address);
        require(newContract != address(0), "Could not deploy contract");
        emit ContractCreation(newContract);
    }
}
