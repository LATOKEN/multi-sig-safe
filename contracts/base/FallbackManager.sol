// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../common/SelfAuthorized.sol";

/// @title Fallback Manager - A contract that manages fallback calls made to this contract
/// @author Richard Meissner - <richard@gnosis.pm>
contract FallbackManager is SelfAuthorized {
    event ChangedFallbackHandler(address handler);

    // keccak256("fallback_manager.handler.address")
   address public handlerAddress;

    function internalSetFallbackHandler(address handler) internal {
        handlerAddress = handler;
    }

    /// @dev Allows to add a contract to handle fallback calls.
    ///      Only fallback calls without value and with data will be forwarded.
    ///      This can only be done via a Safe transaction.
    /// @param handler contract to handle fallback calls.
    function setFallbackHandler(address handler) public authorized {
        internalSetFallbackHandler(handler);
        emit ChangedFallbackHandler(handler);
    }

    // solhint-disable-next-line payable-fallback,no-complex-fallback
    fallback() external {
        if (handlerAddress == address(0)) {
            return;
        }

        bytes20 addr = bytes20(msg.sender);
        bytes memory data = new bytes(msg.data.length + 20);
        for (uint256 i = 0; i < msg.data.length; i++) {
            data[i] = msg.data[i];
        }
        for (uint256 i = 0; i < 20; i++) {
            data[msg.data.length + i] = addr[i];
        }

        (bool success, bytes memory result) = address(handlerAddress).call(data);
        if (success == false) {
            revert(string(result));
        }

        return2(result);
    }
}
