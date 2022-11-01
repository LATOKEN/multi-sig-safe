// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/// @title Multi Send Call Only - Allows to batch multiple transactions into one, but only calls
/// @author Stefan George - <stefan@gnosis.io>
/// @author Richard Meissner - <richard@gnosis.io>
/// @notice The guard logic is not required here as this contract doesn't support nested delegate calls
contract MultiSendCallOnly {
    /// @dev Sends multiple transactions and reverts all if one fails.
    /// @param transactions Encoded transactions. Each transaction is encoded as a packed bytes of
    ///                     operation has to be uint8(0) in this version (=> 1 byte),
    ///                     to as a address (=> 20 bytes),
    ///                     value as a uint256 (=> 32 bytes),
    ///                     data length as a uint256 (=> 32 bytes),
    ///                     data as bytes.
    ///                     see abi.encodePacked for more information on packed encoding
    /// @notice The code is for most part the same as the normal MultiSend (to keep compatibility),
    ///         but reverts if a transaction tries to use a delegatecall.
    /// @notice This method is payable as delegatecalls keep the msg.value from the previous call
    ///         If the calling method (e.g. execTransaction) received ETH this would revert otherwise
    function multiSend(bytes memory transactions) public payable {
        uint256 i = 0;
        while (i < transactions.length) {
            uint8 operation = transactions[i];

            bytes memory addressArray = new bytes(20);
            for (uint256 j = 0; j < 20; j++) {
                addressArray[j] = transactions[i + 1 + j];
            }
            address to = address(bytes20(addressArray));

            bytes memory valueArray = new bytes(32);
            for (uint256 j = 0; j < 32; j++) {
                valueArray[j] = transactions[i + 1 + 20 + j];
            }
            uint256 value = uint256(bytes32(valueArray));

            bytes memory dataLengthArray = new bytes(32);
            for (uint256 j = 0; j < 32; j++) {
                dataLengthArray[j] = transactions[i + 1 + 20 + 32 + j];
            }
            uint256 dataLength = uint256(bytes32(dataLengthArray));

            bytes memory data = new bytes(uint32(dataLength));
            for (uint256 j = 0; j < dataLength; j++) {
                data[j] = transactions[i + 1 + 20 + 32 + 32 + j];
            }

            bool success = false;
            if (operation == 0) {
                (success,) = address(to).call{value: value}(data);
            } else {
                revert();
            }
            require(success);

            i += 1 + 20 + 32 + 32 + dataLength;
        }
    }
}
