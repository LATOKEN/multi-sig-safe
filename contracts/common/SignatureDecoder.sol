// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/// @title SignatureDecoder - Decodes signatures that a encoded as bytes
/// @author Richard Meissner - <richard@gnosis.pm>
contract SignatureDecoder {
    /// @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
    /// @notice Make sure to perform a bounds check for @param pos, to avoid out of bounds access on @param signatures
    /// @param pos which signature to read. A prior bounds check of this parameter should be performed, to avoid out of bounds access
    /// @param signatures concatenated rsv signatures
    function signatureSplit(bytes memory signatures, uint256 pos)
        internal
        pure
        returns (
            uint32 v,
            bytes32 r,
            bytes32 s
        )
    {        
        bytes memory rA = new bytes(32);
        bytes memory sA = new bytes(32);
        for (uint256 i = 0; i < 32; i += 1) {
            rA[i] = signatures[66 * pos + i];
            sA[i] = signatures[66 * pos + i + 32];
        }

        r = bytes32(rA);
        s = bytes32(sA);
        v = uint8(signatures[66 * pos + 64]) * 256 + uint8(signatures[66 * pos + 65]);
    }
}
