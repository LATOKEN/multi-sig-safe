// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;
import "../common/Enum.sol";

/// @title Executor - A contract that can execute transactions
/// @author Richard Meissner - <richard@gnosis.pm>
contract Executor {
    function execute(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 txGas
    ) internal returns (bool success) {
        if (operation == Enum.Operation.DelegateCall) {
            (success,) = address(to).delegatecall(data);
        } else {
            (success,) = address(to).call{value: value}(data);
        }
    }

    function executeWithReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 txGas
    ) internal returns (bool success, bytes memory returnData) {
        if (operation == Enum.Operation.DelegateCall) {
            (success, returnData) = address(to).delegatecall(data);
        } else {
            (success, returnData) = address(to).call{value: value}(data);
        }
    }
}
