// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../base/Executor.sol";

/// @title Simulate Transaction Accessor - can be used with StorageAccessible to simulate Safe transactions
/// @author Richard Meissner - <richard@gnosis.pm>
contract SimulateTxAccessor is Executor {
    address private immutable accessorSingleton;

    constructor() {
        accessorSingleton = address(this);
    }

    modifier onlyDelegateCall() {
        require(address(this) != accessorSingleton, "SimulateTxAccessor should only be called via delegatecall");
        _;
    }

    function simulate(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    )
        external
        onlyDelegateCall()
        returns (
            uint256 estimate,
            bool success,
            bytes memory returnData
        )
    {
        uint256 startGas = gasleft();
        (success, returnData) = executeWithReturnData(to, value, data, operation, gasleft());
        estimate = startGas - gasleft();
    }
}
