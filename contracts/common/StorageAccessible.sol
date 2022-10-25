// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/// @title StorageAccessible - generic base contract that allows callers to access all internal storage.
/// @notice See https://github.com/gnosis/util-contracts/blob/bb5fe5fb5df6d8400998094fb1b32a178a47c3a1/contracts/StorageAccessible.sol
contract StorageAccessible {
    // TODO: Do we need this?
    // /**
    //  * @dev Reads `length` bytes of storage in the currents contract
    //  * @param offset - the offset in the current contract's storage in words to start reading from
    //  * @param length - the number of words (32 bytes) of data to read
    //  * @return the bytes that were read.
    //  */
    // function getStorageAt(uint256 offset, uint256 length) public view returns (bytes memory) {
    //     bytes storage stor;
    //     bytes memory result = new bytes(uint32(length * 32));
    //     for (uint256 index = 0; index < length * 32; index++) {
    //         result = stor[offset * 32 + index];
    //     }
    //     return result;
    // }

    /**
     * @dev Performs a delegatecall on a targetContract in the context of self.
     * Internally reverts execution to avoid side effects (making it static).
     *
     * This method reverts with data equal to `abi.encode(bool(success), bytes(response))`.
     * Specifically, the `returndata` after a call to this method will be:
     * `success:bool || response.length:uint256 || response:bytes`.
     *
     * @param targetContract Address of the contract containing the code to execute.
     * @param calldataPayload Calldata that should be sent to the target contract (encoded method name and arguments).
     */
    function simulateAndRevert(address targetContract, bytes memory calldataPayload) external {
        (bool success, bytes memory response) = address(targetContract).delegatecall(calldataPayload);
        revert(string(abi.encode(success, response)));
    }
}
