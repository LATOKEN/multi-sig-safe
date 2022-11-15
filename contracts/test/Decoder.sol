contract Decoder {
                function decode(address to, bytes memory data) public returns (bytes memory) {
                    (bool success, bytes memory result) = address(to).call(data);
                    require(!success, "Shit happens");
                    return data;
                }
            }